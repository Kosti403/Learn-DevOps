/* r2 · Обзор 2 — накопительный по модулям [[mod:linux]]–15: половина по свежим 9–15 (res, systemd, pkgs, bash1, bash2, pwsh, net1), половина по 1–8 */
REV({id:'r2',title:'Обзор 2: дежурство на сервере',
case:`<p>Ты на дежурстве неделю. За это время: сайт тормозит, сервис не поднимается после перезагрузки, бэкап молча не делается, приложение не видит базу, обновление пакетов чуть не уронило прод, а скрипт коллеги удалил не то. Подсказок нет — только вывод команд, как в реальном чате инцидента.</p><p class="goal"><b>Цель обзора:</b> соединять темы: по выводу нескольких команд найти причину, выбрать безопасное действие и объяснить его. Это ближе всего к вопросам на собеседовании и к реальной работе.</p>`,
theory:`<p>Обзор на 20% сложнее модулей: в каждом задании 2–3 темы, длинный вывод, нет подсказок. Ошибся — открой модуль по ссылке ↺ и перечитай ловушки.</p>`,
ex:[
 {t:'r',ref:'res',q:'Что тормозит сервер?',code:`$ uptime
 load average: 6.80, 6.40, 5.90
$ nproc
2
$ free -h
         total   used   free  shared  buff/cache  available
Mem:     3.8Gi  3.6Gi   80Mi   10Mi        120Mi      95Mi
Swap:    2.0Gi  1.9Gi  100Mi
$ vmstat 1 2 | tail -1
 r  b   swpd   free  buff  cache   si   so   bi   bo  us sy id wa
 3  4 1990000 81000 2100 118000  920 1340  1100 1500 10  8 22 60`,lang:'term',o:['Не хватает памяти: available почти 0, swap полон, идёт активная подкачка (si/so) — отсюда wa и load','Не хватает CPU','Медленный диск сам по себе','Steal у VPS'],a:0,e:'wa высокий не из-за «плохого диска», а из-за swap: si/so ≠ 0. Ищем, кто ест память (ps --sort=-%mem), и почему.'},
 {t:'r',ref:'systemd',q:'Почему сервис не поднялся после перезагрузки?',code:`$ systemctl status shop
○ shop.service - Shop API
     Loaded: loaded (/etc/systemd/system/shop.service; disabled; preset: enabled)
     Active: inactive (dead)`,lang:'term',o:['Автозапуск выключен (disabled) — нужно enable --now','Сервис упал с ошибкой','Нет unit-файла','Нужен daemon-reload'],a:0,e:'Loaded … disabled, Active inactive (dead), не failed. Его просто никто не запускал. sudo systemctl enable --now shop.'},
 {t:'r',ref:'systemd',q:'Что не так?',code:`$ journalctl -u shop -n 3 --no-pager
Nov 26 09:00:01 web-01 systemd[1]: Started shop.service - Shop API.
Nov 26 09:00:01 web-01 node[2201]: Error: ENOENT: no such file or directory, open 'config.json'
Nov 26 09:00:01 web-01 systemd[1]: shop.service: Main process exited, code=exited, status=1/FAILURE`,lang:'term',o:['Относительный путь: у сервиса другая рабочая папка — нужен WorkingDirectory=/opt/shop или абсолютный путь','Нет прав root','config.json повреждён','Нужен restart'],a:0,e:'«В терминале работает, как сервис — нет» — окружение сервиса другое (модуль [[mod:systemd]]).'},
 {t:'i',ref:'systemd',fix:true,q:'Исправь последовательность после правки unit-файла — изменения не применяются.',code:'sudo systemctl restart shop',a:['sudo systemctl daemon-reload && sudo systemctl restart shop','sudo systemctl daemon-reload; sudo systemctl restart shop','systemctl daemon-reload && systemctl restart shop'],ph:'sudo systemctl …',e:'Без daemon-reload systemd использует старую версию юнита из памяти.'},
 {t:'r',ref:'bash2',q:'Почему бэкап не делается уже неделю?',code:`$ sudo crontab -l
0 3 * * * pg_dump shop > /backup/shop-$(date +%F).sql
$ grep CRON /var/log/syslog | tail -1
Nov 26 03:00:01 db-01 CRON[7712]: (root) CMD (pg_dump shop > /backup/shop-$(date +)`,lang:'term',o:['% в crontab — перевод строки: команда обрезана на date +; плюс нет 2>&1 и лога','cron выключен','pg_dump не установлен','Нет прав на /backup'],a:0,e:'В syslog видно обрезанную команду. Лечение: \\%F или вынести в скрипт; вывод — в лог с 2>&1; flock.'},
 {t:'s',ref:'bash2',q:'Собери надёжную строку cron для скрипта бэкапа (каждый день в 3:00).',p:['0 3 * * *','/usr/bin/flock -n /var/lock/backup.lock','/opt/scripts/backup.sh','>> /var/log/backup.log 2>&1'],e:'Расписание → защита от наложения → абсолютный путь → лог с ошибками.'},
 {t:'r',ref:'bash1',q:'Что сделает этот скрипт при запуске без аргумента?',code:`#!/usr/bin/env bash
DIR=$1
cd $DIR
rm -rf ./cache/*`,lang:'sh',o:['cd без аргумента уйдёт в домашнюю папку — и удалит ~/cache/*; set -e тоже нет','Ничего не сделает','Удалит / целиком','Упадёт на первой строке'],a:0,e:'Исправление: set -euo pipefail, DIR="${1:?укажи папку}", [[ -d "$DIR" ]], cd "$DIR" || exit 1.'},
 {t:'i',ref:'bash1',q:'Впиши строгую первую строку скрипта после шебанга и объясни себе каждую букву.',a:['set -euo pipefail','set -eu -o pipefail','set -e -u -o pipefail'],ph:'set …',e:'-e — стоп на ошибке, -u — на пустой переменной, pipefail — на ошибке в пайпе.'},
 {t:'r',ref:'pkgs',q:'Что произойдёт, если сейчас выполнить apt upgrade на проде?',code:`$ apt list --upgradable 2>/dev/null | head -5
Listing...
mssql-server/jammy 16.0.4175.1-1 amd64 [upgradable from: 16.0.4165.4-1]
libssl3t64/noble-security 3.0.13-0ubuntu3.5 amd64 [upgradable from: 3.0.13-0ubuntu3.4]
linux-image-generic/noble-updates 6.8.0.50.50 amd64 [upgradable from: 6.8.0.48.48]
nodejs/nodistro 20.18.1-1nodesource1 amd64 [upgradable from: 20.17.0-1nodesource1]`,lang:'term',o:['Обновятся сразу база, OpenSSL, ядро и Node — рискованно; для срочной безопасности — только --only-upgrade libssl3t64, остальное — плановым окном','Обновится только OpenSSL','Ничего, upgrade безопасен всегда','apt upgrade удалит MS SQL'],a:0,e:'База и рантайм — с бэкапом и окном; ядро — с перезагрузкой. Срочное — точечно.'},
 {t:'r',ref:'pkgs',q:'Почему не ставится?',code:`$ sudo apt install mssql-server
E: Unable to locate package mssql-server
$ ls /etc/apt/sources.list.d/
ubuntu.sources`,lang:'term',o:['Не подключён репозиторий Microsoft (ключ + источник с signed-by), потом apt update','Нет интернета','Пакет называется sqlserver','Нужно запускать без sudo'],a:0,e:'В репозиториях Ubuntu MS SQL нет. Подключить репозиторий разработчика.'},
 {t:'r',ref:'net1',q:'Где проблема?',code:`app$ nc -zv -w3 db-01 1433
nc: connect to db-01 (10.0.5.20) port 1433 (tcp) failed: Connection refused
db-01$ sudo ss -tlnp | grep 1433
LISTEN 0 4096 127.0.0.1:1433 0.0.0.0:* users:(("sqlservr",pid=640))`,lang:'term',o:['MS SQL слушает только 127.0.0.1 — с другой машины не подключиться; нужно слушать внутренний IP (и ограничить firewall)','Firewall выбрасывает пакеты','DNS не работает','База не запущена'],a:0,e:'Имя разрешилось (10.0.5.20), ответ мгновенный refused — машина отвечает, но на внешнем адресе никто не слушает.'},
 {t:'c',ref:'net1',q:'<code>nc -zv api.internal 443</code> висит 3 секунды и пишет <i>timed out</i>, а <code>ping api.internal</code> проходит. Вероятнее всего…',o:['Машина доступна, но порт 443 закрыт firewall (пакеты выбрасываются)','Сервис на 443 не запущен','DNS сломан','Всё нормально'],a:0,e:'Если бы никто не слушал, был бы быстрый refused. Таймаут при живом ping — фильтрация порта.'},
 {t:'r',ref:'pwsh',q:'Почему шаг CI на Windows-раннере «успешен», хотя тесты упали?',code:`$ErrorActionPreference = 'Stop'
dotnet test
if ($?) { Write-Host "tests passed" }
exit 0`,lang:'ps',o:['dotnet — внешняя программа: проверять $LASTEXITCODE и выходить с ним; exit 0 в конце всё перечёркивает','$? всегда False','Нужен Set-StrictMode','Write-Host ломает код'],a:0,e:'if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }. И не завершать скрипт безусловным exit 0.'},
 {t:'i',ref:'pwsh',q:'Впиши PowerShell-команду: проверить, доступен ли порт 1433 на <code>db-01</code>.',a:['Test-NetConnection db-01 -Port 1433','Test-NetConnection -ComputerName db-01 -Port 1433','tnc db-01 -Port 1433'],ph:'Test-NetConnection …',e:'Аналог nc -zv. Смотреть TcpTestSucceeded.'},
 {t:'r',ref:'res',q:'Диск 100%, место не освобождается после удаления лога. Что делать?',code:`$ sudo lsof +L1 | head -3
COMMAND  PID  USER   FD  TYPE  SIZE/OFF     NLINK NAME
node    1950  deploy 12w REG   21474836480  0     /var/log/shop/debug.log (deleted)`,lang:'term',o:['Обнулить через дескриптор (: > /proc/1950/fd/12) или перезапустить shop; на будущее — truncate и ротация логов','Перезагрузить сервер','Удалить ещё раз','Ничего, место освободится само завтра'],a:0,e:'20 ГБ держит процесс. Причина глубже — debug-лог без ротации (logrotate, модуль [[mod:text]]).'},
 {t:'s',ref:'res',q:'Собери рассказ на собесе «сервер тормозит» в правильном порядке.',p:['uptime: load и тренд, сравнить с nproc','top: us / wa / st — какой ресурс','free, df, iostat, ss — подтвердить ресурс','ps/pidstat/iotop — кто','логи, strace, что менялось — почему','лечение причины, а не перезагрузка'],e:'Метод важнее команд.'},
 {t:'r',ref:'procs',q:'Что случилось с контейнером базы?',code:`$ docker inspect mssql --format '{{.State.ExitCode}} {{.State.OOMKilled}}'
137 true
$ docker inspect mssql --format '{{.HostConfig.Memory}}'
1073741824`,lang:'term',o:['OOM: лимит памяти 1 ГБ, а MS SQL требует минимум 2 ГБ — ядро убило процесс (137)','Ошибка в SQL-запросе','docker stop','Повреждён образ'],a:0,e:'137 = SIGKILL, OOMKilled: true, лимит 1 GiB. Поднять лимит до 2 ГБ+.'},
 {t:'c',ref:'procs',q:'Нужно перезапустить зависшее приложение, которое держит незаписанный кэш. Правильный порядок?',o:['systemctl stop (SIGTERM), подождать; если не завершилось — kill -9; разобраться, почему не реагировало на SIGTERM','Сразу kill -9','reboot','kill -HUP'],a:0,e:'Дать шанс корректно завершиться. SIGKILL — последнее средство.'},
 {t:'r',ref:'perms',q:'Почему nginx отдаёт 403 на статику?',code:`$ namei -l /opt/shop/public/index.html
drwxr-xr-x root   root   /
drwxr-xr-x root   root   opt
drwxr-x--- deploy deploy shop
drwxr-xr-x deploy deploy public
-rw-r--r-- deploy deploy index.html
$ ps -o user= -C nginx | sort -u
root
www-data`,lang:'term',o:['worker nginx работает от www-data, а у /opt/shop нет x для «остальных»','index.html нечитаем','nginx должен быть root','Нужен chmod 777'],a:0,e:'Минимально: chmod o+x /opt/shop (или группа www-data с r-x на папку).'},
 {t:'i',ref:'streams',q:'Впиши: запустить <code>./migrate.sh</code>, показывая вывод на экране и сохраняя и вывод, и ошибки в <code>migrate.log</code>.',a:['./migrate.sh 2>&1 | tee migrate.log','./migrate.sh |& tee migrate.log'],ph:'./migrate.sh …',e:'2>&1 до пайпа — иначе ошибки не попадут в tee. В скрипте — ещё и set -o pipefail.'},
 {t:'s',ref:'text',q:'Собери: сколько ответов 5xx было в каждую минуту (поле времени — $4, вида [26/Nov/2026:10:15:32).',p:["awk '$9 >= 500 {print substr($4, 2, 17)}' /var/log/nginx/access.log",'| sort','| uniq -c','| sort -rn','| head'],e:'Вырезать «дата:час:минута» → группировать → посчитать → худшие минуты сверху. Так находят начало инцидента.'},
 {t:'r',ref:'files',q:'После установки пакета nginx ты не можешь найти, куда он положил свои файлы. Что выведет нужную информацию?',code:`$ dpkg -L nginx-core | grep -E "bin|etc" | head -4
/usr/sbin/nginx
/etc/nginx/nginx.conf
/etc/nginx/sites-available/default
/etc/nginx/sites-enabled/default`,lang:'term',o:['dpkg -L — список файлов пакета: бинарник в /usr/sbin, конфиги в /etc/nginx','find / -name nginx','which nginx','apt show nginx'],a:0,e:'Связь модулей [[mod:files]] и [[mod:pkgs]]: стандарт FHS + база пакетов.'},
 {t:'c',ref:'shell',q:'Скрипт работает, когда ты делаешь <code>bash deploy.sh</code>, но не работает через <code>sh deploy.sh</code> — ошибка на <code>[[</code>. Почему?',o:['sh в Ubuntu — это dash, он не знает [[ ]] — запускать через bash или ./ с шебангом bash','Нужен chmod +x','CRLF-переносы','Нет прав root'],a:0,e:'Синтаксис bash ≠ POSIX sh.'},
 {t:'r',ref:'linux',q:'Можно ли ставить на этот сервер MS SQL Server 2022 из репозитория Microsoft для Ubuntu?',code:`$ cat /etc/os-release | grep -E "^(NAME|VERSION_ID|ID_LIKE)"
NAME="Rocky Linux"
VERSION_ID="9.4"
ID_LIKE="rhel centos fedora"
$ uname -m
x86_64`,lang:'term',o:['Нет — это семейство RHEL: нужен репозиторий Microsoft для RHEL и dnf, а не пакеты для Ubuntu и apt','Да, apt есть везде','Нет — архитектура не подходит','Да, если добавить ID_LIKE=debian'],a:0,e:'Сначала «кто ты», потом установка. x86_64 — подходит, семейство — другое.'},
 {t:'c',ref:'net1',q:'С ноутбука нужно подключиться SSMS к MS SQL на сервере, где порт 1433 закрыт снаружи. Самый безопасный путь?',o:['ssh -L 1433:localhost:1433 deploy@db-01 и SSMS к localhost,1433','Открыть 1433 в интернет','Отключить ufw на время','Поставить SSMS на сервер'],a:0,e:'Порт базы закрыт, трафик зашифрован внутри SSH.'},
 {t:'c',ref:'res',q:'Каждую ночь в 3:00–3:40 растёт wa и тормозит сайт. В cron в 3:00 — бэкап базы. Лучшее решение?',o:['Запускать бэкап с nice/ionice, в окно минимальной нагрузки, по возможности — с реплики; проверить, что бэкапы не копятся на том же диске','Отключить бэкапы','Перенести сайт на другой сервер','Перезагружать сервер в 3:40'],a:0,e:'Связь модулей [[mod:res]], [[mod:bash2]] и [[mod:procs]]: нагрузка по расписанию, приоритеты процессов.'}]});
