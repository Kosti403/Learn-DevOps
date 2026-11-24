/* r1 · Обзор 1 — накопительный по модулям [[mod:linux]]–7 (linux, shell, files, perms, streams, text, procs) */
REV({id:'r1',title:'Обзор 1: первые шаги на сервере',
case:`<p>Ты дежурный. За смену прилетает десяток мелких задач: незнакомый сервер, скрипт не запускается, сайт не открывается, бэкапа нет, в логе что-то странное. Подсказок нет — как на настоящей работе.</p><p class="goal"><b>Цель модуля:</b> проверить, что темы первых модулей работают вместе: соединить в одной задаче дистрибутив, пути, права, потоки и логи.</p>`,
theory:`<p>Без подсказок. Каждое задание — ситуация, где нужно соединить несколько тем: дистрибутив, оболочку, пути и файлы. Ошибся — перечитай модуль по ссылке ↺.</p>`,
ex:[
 {t:'r',ref:'linux',q:'Ты зашёл на сервер. Какой командой ставить пакеты?',code:`$ cat /etc/os-release | head -4
NAME="AlmaLinux"
VERSION="9.4 (Seafoam Ocelot)"
ID="almalinux"
ID_LIKE="rhel centos fedora"`,lang:'term',o:['dnf install','apt install','apk add','pacman -S'],a:0,e:'ID_LIKE=rhel → семейство Red Hat → dnf.'},
 {t:'c',ref:'linux',q:'На проде <code>VERSION_ID="23.10"</code>. Какой главный риск?',o:['Промежуточный релиз давно без патчей безопасности','Слишком новое ядро','Не работает SSH','Нет менеджера пакетов'],a:0,e:'23.10 — interim, 9 месяцев поддержки (до середины 2024). Сервер годами без патчей.'},
 {t:'i',ref:'files',q:'Впиши одной командой: следить за логом ошибок nginx так, чтобы чтение пережило ротацию.',a:['tail -F /var/log/nginx/error.log','sudo tail -F /var/log/nginx/error.log'],ph:'tail …',e:'Логи nginx — /var/log/nginx, ротация → -F.'},
 {t:'r',ref:'shell',q:'Что не так?',code:`$ cd /opt/app
$ ls -l
-rw-r--r-- 1 deploy deploy 412 Nov 20 run.sh
$ ./run.sh
-bash: ./run.sh: Permission denied`,lang:'term',o:['У файла нет права x — нужен chmod +x run.sh','Нет шебанга','Неверный путь','Скрипт с CRLF'],a:0,e:'В правах rw-r--r-- нигде нет x. chmod +x или bash run.sh.'},
 {t:'r',ref:'shell',q:'Скрипт написан в VS Code на Windows и залит на сервер. Что видим?',code:`$ cat -A deploy.sh | head -2
#!/usr/bin/env bash^M$
set -e^M$`,lang:'term',o:['CRLF-переносы: ^M — это \\r, нужно dos2unix','Скрипт зашифрован','Нет прав на чтение','Скрипт для PowerShell'],a:0,e:'cat -A показывает \\r как ^M. Убираем: dos2unix deploy.sh.'},
 {t:'c',ref:'files',q:'Диск забит. Где искать в первую очередь на сервере с Docker и nginx?',o:['/var/log и /var/lib/docker','/etc и /boot','/proc и /sys','/usr/bin'],a:0,e:'Растут логи и данные сервисов — /var. /proc и /sys не занимают диск вообще.'},
 {t:'s',ref:'files',q:'Нужно поменять порт в <code>/etc/myapp/app.conf</code> на проде. Собери порядок.',p:['cp -a /etc/myapp/app.conf /etc/myapp/app.conf.bak','Отредактировать app.conf','Проверить конфиг средствами приложения','Перезапустить сервис','Убедиться по логу в /var/log, что поднялся'],e:'Бэкап → правка → проверка → применение → проверка по логу.'},
 {t:'i',ref:'files',fix:true,q:'Исправь: должна найти все .conf в /etc, а выдаёт мусор или ошибку <i>paths must precede expression</i>.',code:'find /etc -name *.conf',a:['find /etc -name "*.conf"',"find /etc -name '*.conf'"],ph:'find …',e:'Bash раскрыл *.conf по текущей папке до запуска find. Кавычки отдают шаблон find.'},
 {t:'c',ref:'linux',q:'В контейнере <code>ubuntu:22.04</code> на хосте с ядром 6.8 команда <code>uname -r</code> покажет…',o:['6.8 — ядро хоста','5.15 — ядро Ubuntu 22.04','Ошибку','22.04'],a:0,e:'У контейнера нет своего ядра. А /etc/os-release внутри покажет Ubuntu 22.04.'},
 {t:'c',ref:'shell',q:'<code>env.sh</code> делает <code>export DB_HOST=db</code>. После <code>./env.sh</code> переменной в терминале нет. Почему?',o:['Скрипт выполнился в дочернем процессе; нужно source env.sh','export работает только в PowerShell','Нужен sudo','Переменная записалась в /etc'],a:0,e:'Дочерний процесс не может изменить окружение родителя. source выполняет в текущей оболочке.'},
 {t:'i',ref:'shell',q:'Впиши команду: найти, где лежит программа <code>docker</code>.',a:['which docker','command -v docker','type docker','type -p docker'],ph:'…',e:'which ищет по $PATH. command -v — POSIX-вариант, удобен в скриптах.'},
 {t:'r',ref:'files',q:'Почему сайт не работает, хотя ссылка есть?',code:`$ ls -l /etc/nginx/sites-enabled/
lrwxrwxrwx 1 root root 33 shop -> /etc/nginx/sites-available/shp
$ ls /etc/nginx/sites-available/
default  shop`,lang:'term',o:['Ссылка ведёт на несуществующий файл shp — опечатка, ссылка висит','Нужно перезагрузить сервер','Файл shop пустой','Ссылки nginx не читает'],a:0,e:'Цель ссылки — shp, а файл называется shop. Пересоздать: ln -sf /etc/nginx/sites-available/shop …'},
 {t:'c',ref:'shell',q:'Ты под root (<code>#</code>) и набираешь <code>rm -rf /opt/app /</code> — пробел перед последним /. Что произойдёт?',o:['/opt/app удалится, а на / GNU rm откажется (защита --preserve-root); с /* такой защиты уже нет','Ничего не удалится — ошибка синтаксиса','Удалится вся система без предупреждений','rm спросит подтверждение для каждого файла'],a:0,e:'Два аргумента: /opt/app и /. Современный rm по умолчанию не трогает сам корень, но rm -rf /* (bash раскроет в /bin /etc …) снесёт всё. Перед rm -rf — ls того же пути.'},
 {t:'i',ref:'files',q:'Впиши: последние 30 строк системного лога Ubuntu.',a:['tail -n 30 /var/log/syslog','tail -30 /var/log/syslog','sudo tail -n 30 /var/log/syslog','tail -n30 /var/log/syslog'],ph:'tail …',e:'/var/log/syslog — общий лог в Ubuntu (в RHEL — /var/log/messages).'},
 {t:'c',ref:'linux',q:'На собесе: «Почему вы выбрали бы Ubuntu LTS, а не Arch для прода?» Лучший короткий ответ:',o:['Фиксированная версия с патчами безопасности на 5+ лет — обновления не ломают совместимость','Arch нельзя поставить на сервер','В Ubuntu быстрее ядро','В Arch нет SSH'],a:0,e:'Суть — предсказуемость: rolling release несёт непрерывные изменения, LTS — только исправления.'},
 {t:'s',ref:'shell',q:'Скрипт из репозитория не запускается. Собери порядок диагностики.',p:['ls -l script.sh — есть ли x','head -1 script.sh — какой шебанг','cat -A script.sh | head — нет ли ^M','Запустить bash -x script.sh — где падает'],e:'Права → интерпретатор → переносы → трассировка (bash -x печатает каждую команду).'},
 {t:'c',ref:'files',q:'Нужна точная копия <code>/etc/nginx</code> перед обновлением, с правами и владельцами. Что выбрать?',o:['cp -a /etc/nginx /root/nginx.bak','cp /etc/nginx /root/nginx.bak','mv /etc/nginx /root/nginx.bak','ln -s /etc/nginx /root/nginx.bak'],a:0,e:'cp без -r не скопирует папку, mv унесёт оригинал, ссылка — не копия.'},
 {t:'r',ref:'files',q:'Что это за файл и можно ли его читать как текст?',code:`$ file /usr/bin/ls /etc/hosts /var/log/syslog.2.gz
/usr/bin/ls:            ELF 64-bit LSB pie executable, x86-64
/etc/hosts:             ASCII text
/var/log/syslog.2.gz:   gzip compressed data`,lang:'term',o:['ls — бинарник, hosts — текст, syslog.2.gz — сжатый лог (читать zcat/zless)','Все три — текст','Все три — бинарники','hosts — архив'],a:0,e:'Старые логи после ротации сжаты. Читать без распаковки: zless, zcat, zgrep.'},
 {t:'c',ref:'shell',q:'В PowerShell на Windows нужно запустить <code>build.ps1</code> из текущей папки. Как?',o:['.\\build.ps1','build.ps1','sh build.ps1','./build.sh'],a:0,e:'Как и в bash, явный путь к текущей папке. ExecutionPolicy может ещё запретить запуск — тогда Get-ExecutionPolicy.'},
 {t:'i',ref:'files',q:'Впиши одной командой: создать <code>/opt/app/releases/2026-11-24</code> и <code>/opt/app/shared/logs</code>.',a:['mkdir -p /opt/app/releases/2026-11-24 /opt/app/shared/logs','sudo mkdir -p /opt/app/releases/2026-11-24 /opt/app/shared/logs'],ph:'mkdir …',e:'mkdir принимает несколько путей; -p создаёт родителей.'},
 {t:'c',ref:'linux',q:'Какая команда скажет, ARM у тебя или x86 (важно для выбора Docker-образа)?',o:['uname -m','uname -r','cat /etc/os-release','hostname'],a:0,e:'uname -m → x86_64 или aarch64. Образ под чужую архитектуру упадёт с exec format error.'},
 {t:'r',ref:'files',q:'Почему <code>tail -f</code> молчит, хотя сайт работает?',code:`$ ls -l /var/log/nginx/
-rw-r----- 1 www-data adm 52881 Nov 24 09:14 access.log
-rw-r----- 1 www-data adm 9912044 Nov 24 00:00 access.log.1
$ tail -f access.log.1`,lang:'term',o:['Следим за старым, ротированным файлом — новые записи идут в access.log','Нет прав','nginx завис','Сломан tail'],a:0,e:'access.log.1 — вчерашний. Нужен tail -F access.log.'},
 {t:'r',ref:'perms',q:'Nginx отдаёт 403. Что чинить?',code:`$ namei -l /srv/shop/index.html
f: /srv/shop/index.html
drwxr-xr-x root root /
drwxr-xr-x root root srv
drwx------ deploy deploy shop
-rw-r--r-- deploy deploy index.html`,lang:'term',o:['У www-data нет x на /srv/shop — дать chmod 755 /srv/shop (или доступ через группу)','chmod 777 index.html','Перезапустить nginx','Сменить владельца / на www-data'],a:0,e:'Файл читаем всеми, но войти в папку shop может только deploy. Права на файл не помогут без x на каждой папке пути.'},
 {t:'i',ref:'streams',q:'Впиши строку для cron-задачи: запуск <code>/opt/backup.sh</code> с дописыванием и вывода, и ошибок в <code>/var/log/backup.log</code> (только команду, без расписания).',a:['/opt/backup.sh >> /var/log/backup.log 2>&1','/opt/backup.sh &>> /var/log/backup.log'],ph:'/opt/backup.sh …',e:'>> — не затирать прошлые запуски, 2>&1 — ошибки туда же, иначе «молча не работает».'},
 {t:'s',ref:'text',q:'Собери: топ-5 адресов, которые чаще всего получают 404.',p:["awk '$9 == 404 {print $7}' /var/log/nginx/access.log",'| sort','| uniq -c','| sort -rn','| head -5'],e:'Отбор по полю кода → поле пути → группировка → подсчёт → по убыванию.'},
 {t:'r',ref:'procs',q:'Что случилось с сервисом?',code:`$ docker ps -a --format '{{.Names}} {{.Status}}'
shop-api  Exited (137) 2 minutes ago
$ dmesg | tail -2
Out of memory: Killed process 4120 (node) total-vm:2105440kB
oom_reaper: reaped process 4120 (node)`,lang:'term',o:['Процесс убит OOM killer (SIGKILL → 137): не хватило памяти','Ошибка в коде, приложение упало само','Его остановили docker stop','Образ повреждён'],a:0,e:'137 = 128+9, а dmesg прямо говорит про Out of memory. Смотреть лимиты и утечки памяти.'},
 {t:'c',ref:'procs',q:'Импорт по SSH идёт уже 20 минут, нужно уехать, ноутбук закрыть. Процесс запущен на переднем плане в обычном терминале. Как спасти, не перезапуская?',o:['Ctrl+Z → bg → disown, затем отключаться','Просто закрыть ноутбук — продолжит','Ctrl+C и запустить в tmux','kill -HUP'],a:0,e:'bg продолжает в фоне, disown отвязывает от оболочки — SIGHUP при выходе его не тронет. На будущее — сразу запускать в tmux.'},
 {t:'i',ref:'perms',fix:true,q:'Исправь: добавили deploy в группу docker, а он выпал из sudo.',code:'sudo usermod -G docker deploy',a:['sudo usermod -aG docker deploy','usermod -aG docker deploy','sudo usermod -a -G docker deploy'],ph:'sudo usermod …',e:'Без -a список групп заменяется целиком. Вернуть sudo: sudo usermod -aG sudo deploy (из-под другого админа).'}]});
