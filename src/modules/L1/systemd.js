/* systemd · L1 · systemd, unit-файлы, journalctl, таймеры */
MOD({id:'systemd',title:'systemd и журнал',sub:'Сервисы: запуск, автозапуск, автоперезапуск, unit-файлы, journalctl, таймеры вместо cron.',
case:`<p>Ты запустил своё приложение на сервере командой <code>node app.js &amp;</code>. Всё работает. Ночью хостинг перезагрузил сервер для обновления — утром сайт лежит: приложение никто не запустил. Через неделю другая беда: приложение упало от ошибки в 3 часа ночи и пролежало до утра, потому что никто его не поднял. А когда ты спрашиваешь «почему упало?» — логов нет: вывод шёл в терминал, который давно закрыт.</p><p class="goal"><b>Цель модуля:</b> превращать любую программу в нормальный сервис — сам стартует при загрузке, сам поднимается после падения, работает от нужного пользователя, а все его логи лежат в одном месте и ищутся за секунды.</p>`,
intro:`<p><b>systemd</b> — первый процесс системы (PID 1, модуль 7). Он запускает всё остальное при загрузке и дальше <mark>присматривает</mark> за сервисами: кто должен работать, в каком порядке стартовать, что делать при падении.</p>
<p>Без него каждый сервис пришлось бы запускать руками или самописными скриптами, и после перезагрузки или падения кто-то должен был бы проснуться ночью и поднять всё заново. С ним ты один раз описываешь сервис в коротком файле — и дальше он «живёт сам».</p>
<p>Второй половиной идёт <b>журнал</b> (journald): systemd собирает вывод всех сервисов и ядра в одно место с точным временем. Вместо поиска по десятку файлов — одна команда <code>journalctl</code>. Это первое, куда ты смотришь, когда «сервис не работает».</p>`,
theory:`<h2>Юниты</h2>
<p>Всё, чем управляет systemd, называется <b>unit</b> (юнит). Тип — по окончанию имени:</p>
${tbl(['Тип','Пример','Что это'],[
 ['<code>.service</code>','<code>nginx.service</code>','сервис — программа, которая работает (главный тип для нас)'],
 ['<code>.timer</code>','<code>logrotate.timer</code>','расписание запуска сервиса (замена cron)'],
 ['<code>.socket</code>','<code>docker.socket</code>','запуск сервиса при первом обращении к сокету'],
 ['<code>.target</code>','<code>multi-user.target</code>','группа юнитов, «состояние системы» (обычная загрузка без графики)'],
 ['<code>.mount</code>','<code>home.mount</code>','точка монтирования']])}
<h2>systemctl — пульт управления</h2>
${CMDS([['systemctl status nginx','состояние, PID, последние строки лога — <b>первая команда при любой проблеме</b>'],['sudo systemctl start nginx','запустить сейчас'],['sudo systemctl stop nginx','остановить (SIGTERM, потом SIGKILL)'],['sudo systemctl restart nginx','остановить и запустить — короткий простой'],['sudo systemctl reload nginx','перечитать конфиг без остановки (если сервис умеет)'],['sudo systemctl enable nginx','включить <b>автозапуск</b> при загрузке'],['sudo systemctl enable --now nginx','включить автозапуск и сразу запустить'],['sudo systemctl disable nginx','убрать из автозапуска'],['systemctl is-active nginx','active / inactive / failed — удобно в скриптах'],['systemctl --failed','все упавшие юниты'],['systemctl cat nginx','показать unit-файл сервиса'],['sudo systemctl daemon-reload','перечитать unit-файлы после их правки']])}
${BOX('start ≠ enable','<p><code>start</code> — запустить <b>сейчас</b>. <code>enable</code> — запускать <b>при каждой загрузке</b>. Это независимые вещи: можно запустить и забыть включить автозапуск (после перезагрузки сервис не поднимется), а можно включить автозапуск и не запустить сейчас. Поэтому почти всегда пишут <code>enable --now</code>.</p>','warn')}
<h2>Как читать systemctl status</h2>
${C(`
$ systemctl status shop
● shop.service - Shop API (Node.js)
     Loaded: loaded (/etc/systemd/system/shop.service; enabled; preset: enabled)
     Active: failed (Result: exit-code) since Tue 2026-11-25 03:12:44 UTC; 6h ago
    Process: 1950 ExecStart=/usr/bin/node /opt/shop/app.js (code=exited, status=1/FAILURE)
   Main PID: 1950 (code=exited, status=1/FAILURE)

Nov 25 03:12:44 web-01 node[1950]: Error: connect ECONNREFUSED 127.0.0.1:5432
Nov 25 03:12:44 web-01 systemd[1]: shop.service: Failed with result 'exit-code'.
`,'term')}
${tbl(['Строка','Что говорит'],[
 ['<b>Loaded</b>','где лежит unit-файл и включён ли автозапуск (<code>enabled</code>)'],
 ['<b>Active</b>','<code>active (running)</code> — работает; <code>failed</code> — упал; <code>inactive (dead)</code> — остановлен. И с какого времени'],
 ['<b>Main PID / status</b>','код выхода: 1 — ошибка программы, 137 — убит SIGKILL (модуль 7)'],
 ['последние строки','хвост журнала — часто там сразу причина (здесь: база на 5432 не отвечает)']])}
<h2>Unit-файл своего сервиса</h2>
${C(`# /etc/systemd/system/shop.service
[Unit]
Description=Shop API (Node.js)
After=network-online.target postgresql.service   # стартовать после сети и базы
Wants=network-online.target

[Service]
Type=simple
User=deploy                                       # не от root!
WorkingDirectory=/opt/shop
EnvironmentFile=/opt/shop/.env                    # переменные: PORT, DB_PASSWORD…
ExecStart=/usr/bin/node /opt/shop/app.js          # путь только абсолютный
Restart=on-failure                                # поднимать после падения
RestartSec=3

[Install]
WantedBy=multi-user.target                        # к какой «цели» привязать enable`,'out')}
${tbl(['Секция','Зачем'],[
 ['<b>[Unit]</b>','описание и порядок: <code>After=</code> — после чего стартовать, <code>Wants=/Requires=</code> — что нужно рядом'],
 ['<b>[Service]</b>','как запускать: команда, пользователь, папка, переменные, политика перезапуска'],
 ['<b>[Install]</b>','что делает <code>enable</code>: к какой цели загрузки привязать сервис']])}
${CMDS([['sudo nano /etc/systemd/system/shop.service','свои юниты — в /etc/systemd/system'],['sudo systemctl daemon-reload','после любой правки unit-файла'],['sudo systemctl enable --now shop','включить и запустить'],['sudo systemctl edit nginx','добавить свои настройки к чужому юниту (drop-in override), не трогая файл пакета']])}
<p>Юниты из пакетов лежат в <code>/lib/systemd/system/</code> (или <code>/usr/lib/…</code>) — их не правят: обновление пакета затрёт изменения. Для своих поправок есть <code>systemctl edit</code> — создаёт <code>/etc/systemd/system/nginx.service.d/override.conf</code>.</p>
${BOX('Почему «в терминале работает, а как сервис — нет»','<p>Сервис запускается не из твоей оболочки: у него нет твоего <code>~/.bashrc</code>, другой <code>PATH</code>, другая текущая папка, другой пользователь. Отсюда классика: относительные пути, переменные окружения, которых нет (они были в твоём <code>export</code>), права пользователя сервиса на файлы. Лечение: абсолютные пути, <code>WorkingDirectory</code>, <code>EnvironmentFile</code>, правильный <code>User</code>.</p>','deep')}
<h2>journalctl — журнал</h2>
${CMDS([['journalctl -u shop','весь журнал сервиса'],['journalctl -u shop -f','следить в реальном времени'],['journalctl -u shop -n 100 --no-pager','последние 100 строк'],['journalctl -u shop --since "1 hour ago"','за последний час (или --since "2026-11-25 03:00")'],['journalctl -p err -b','только ошибки с текущей загрузки'],['journalctl -b -1','журнал прошлой загрузки — что было перед перезагрузкой/падением'],['journalctl -k','только ядро (то же, что dmesg)'],['journalctl --disk-usage','сколько места занимает журнал'],['sudo journalctl --vacuum-time=14d','удалить записи старше 14 дней']])}
<p>Если в <code>/var/log/journal/</code> пусто, журнал хранится только в памяти и <mark>пропадает при перезагрузке</mark>. Тогда <code>journalctl -b -1</code> ничего не покажет. Включить постоянное хранение: <code>sudo mkdir -p /var/log/journal &amp;&amp; sudo systemctl restart systemd-journald</code>.</p>
<h2>Таймеры — расписание без cron</h2>
${C(`# /etc/systemd/system/backup.service        — что делать
[Service]
Type=oneshot
ExecStart=/opt/scripts/backup.sh

# /etc/systemd/system/backup.timer          — когда
[Timer]
OnCalendar=*-*-* 03:00:00
Persistent=true          # если сервер был выключен в 3:00 — выполнить при включении

[Install]
WantedBy=timers.target`,'out')}
${CMDS([['sudo systemctl enable --now backup.timer','включить таймер (не сервис!)'],['systemctl list-timers','все таймеры: когда последний раз и следующий'],['journalctl -u backup','вывод каждого запуска — сам, без >> log 2>&1']])}
<p>Плюсы таймеров перед cron: вывод сам попадает в журнал, видно, когда был прошлый запуск и чем кончился, есть <code>Persistent</code>. Cron остаётся простым и привычным — встретишь оба.</p>`,
memo:`<p>Цикл, который надо довести до автоматизма: написал unit → <code>daemon-reload</code> → <code>enable --now</code> → <code>status</code> → <code>journalctl -u … -f</code>. И при любой проблеме с сервисом — сначала <code>systemctl status</code>, потом <code>journalctl -u … -n 100</code>, и только потом догадки.</p>`,
traps:[
 ['Поправил unit-файл и сделал restart — ничего не поменялось','sudo systemctl daemon-reload, потом restart','systemd держит юниты в памяти. Без daemon-reload он не видит изменений (и сам предупредит в status).'],
 ['systemctl start shop — «готово», а после перезагрузки сервиса нет','sudo systemctl enable --now shop','start запускает один раз. Автозапуск включает enable.'],
 ['ExecStart=node app.js','ExecStart=/usr/bin/node /opt/shop/app.js','systemd требует абсолютный путь к программе и не ищет файлы относительно «текущей папки» без WorkingDirectory.'],
 ['Сервис без User= — работает от root','User=deploy (или отдельный пользователь сервиса)','Уязвимость в приложении сразу даёт атакующему root на сервере.'],
 ['Править /lib/systemd/system/nginx.service','sudo systemctl edit nginx (drop-in override)','Файлы пакетов перезапишет обновление. Свои настройки — в /etc.'],
 ['restart nginx после правки конфига на проде','nginx -t, затем reload','restart рвёт текущие соединения, а при ошибке в конфиге сервис не поднимется. reload мягко перечитает и при ошибке оставит старый конфиг работать.']],
ex:[
 {t:'c',q:'Что такое systemd?',o:['Система инициализации (PID 1): запускает сервисы и следит за ними','Менеджер пакетов','Веб-сервер','Файловая система'],a:0,e:'Запускает всё при загрузке, перезапускает упавшее, собирает журнал.'},
 {t:'c',q:'Чем <code>systemctl enable</code> отличается от <code>systemctl start</code>?',o:['enable — автозапуск при загрузке, start — запуск сейчас','Ничем','enable запускает сейчас, start — при загрузке','enable удаляет сервис'],a:0,e:'Это независимые действия. enable --now делает оба.'},
 {t:'c',q:'Чем <code>reload</code> отличается от <code>restart</code>?',o:['reload перечитывает конфиг без остановки, restart останавливает и запускает заново','Ничем','reload перезагружает сервер','restart только перечитывает конфиг'],a:0,e:'reload не рвёт соединения, но работает только у сервисов, которые это умеют (nginx, postgres).'},
 {t:'c',q:'Где класть unit-файлы своих сервисов?',o:['/etc/systemd/system/','/lib/systemd/system/','/var/log/','/opt/systemd/'],a:0,e:'/lib (/usr/lib) — для пакетов, их перезаписывают обновления. Своё — в /etc/systemd/system.'},
 {t:'c',q:'Что делает <code>Restart=on-failure</code>?',o:['Перезапускает сервис, если он завершился с ошибкой или был убит сигналом','Перезагружает сервер при ошибке','Запрещает перезапуск','Перезапускает каждые 5 минут'],a:0,e:'Сервис поднимется сам. RestartSec задаёт паузу перед перезапуском.'},
 {t:'c',q:'Что значит <code>Active: inactive (dead)</code>?',o:['Сервис остановлен (не работает, но и не падал)','Сервис упал с ошибкой','Сервис работает','Сервис удалён'],a:0,e:'failed — упал с ошибкой. inactive — просто не запущен (или штатно остановлен).'},
 {t:'i',q:'Впиши: включить автозапуск сервиса <code>shop</code> и сразу его запустить.',a:['sudo systemctl enable --now shop','systemctl enable --now shop','sudo systemctl enable --now shop.service','systemctl enable --now shop.service'],ph:'sudo systemctl …',e:'enable --now = enable + start.'},
 {t:'i',q:'Впиши: следить за журналом сервиса <code>nginx</code> в реальном времени.',a:['journalctl -u nginx -f','sudo journalctl -u nginx -f','journalctl -fu nginx','journalctl -f -u nginx','journalctl -u nginx.service -f'],ph:'journalctl …',e:'-u — юнит, -f — follow, как tail -f.'},
 {t:'i',q:'Впиши: перечитать unit-файлы после их изменения.',a:['sudo systemctl daemon-reload','systemctl daemon-reload'],ph:'sudo systemctl …',e:'Без этого systemd использует старую версию из памяти.'},
 {t:'i',q:'Впиши: показать только ошибки журнала с текущей загрузки.',a:['journalctl -p err -b','journalctl -b -p err','sudo journalctl -p err -b','journalctl -p 3 -b'],ph:'journalctl …',e:'-p err — приоритет «ошибка» и важнее, -b — текущая загрузка.'},
 {t:'s',q:'Собери порядок: превратить своё приложение в сервис.',p:['Написать /etc/systemd/system/shop.service','sudo systemctl daemon-reload','sudo systemctl enable --now shop','systemctl status shop','journalctl -u shop -f — убедиться, что стартовало без ошибок'],e:'Файл → перечитать → включить и запустить → проверить состояние → проверить лог.'},
 {t:'s',q:'Собери unit-файл: расставь секции и строки по порядку.',p:['[Unit]','Description=Shop API','[Service]','ExecStart=/usr/bin/node /opt/shop/app.js','[Install]','WantedBy=multi-user.target'],e:'[Unit] — описание и порядок, [Service] — как запускать, [Install] — что делает enable.'},
 {t:'r',q:'Почему не работает сервис?',code:`● shop.service - Shop API
     Loaded: loaded (/etc/systemd/system/shop.service; enabled)
     Active: failed (Result: exit-code) since Tue 03:12:44; 6h ago
Nov 25 03:12:44 web-01 node[1950]: Error: connect ECONNREFUSED 127.0.0.1:5432`,lang:'out',o:['Приложение не может подключиться к базе на порту 5432 — проверить postgresql','Нет прав на unit-файл','Сервис не включён в автозапуск','Ошибка в nginx'],a:0,e:'ECONNREFUSED — по адресу никто не слушает. 5432 — Postgres. Дальше: systemctl status postgresql. Заодно — After=postgresql.service в unit.'},
 {t:'r',q:'Что не так?',code:`$ sudo systemctl restart shop
Warning: The unit file, source configuration file or drop-ins of shop.service
changed on disk. Run 'systemctl daemon-reload' to reload units.`,lang:'term',o:['Unit-файл менялся, а daemon-reload не сделан — работает старая версия','Сервис удалён','Нет прав sudo','Это не ошибка, всё применилось'],a:0,e:'systemd прямо говорит: сначала daemon-reload, потом restart.'},
 {t:'r',q:'Что покажет этот юнит?',code:`$ systemctl list-timers --no-pager | head -3
NEXT                        LEFT     LAST                        PASSED  UNIT          ACTIVATES
Wed 2026-11-26 03:00:00 UTC 16h left Tue 2026-11-25 03:00:02 UTC 7h ago  backup.timer  backup.service`,lang:'term',o:['Бэкап запускается таймером в 3:00, последний раз — сегодня в 3:00, следующий — завтра','backup.service сейчас работает','Таймер выключен','Бэкап не запускался'],a:0,e:'list-timers показывает прошлый и следующий запуск. Чем кончился прошлый — journalctl -u backup.'},
 {t:'c',g:'prac',q:'Скрипт запускается из терминала, а как сервис падает с <i>No such file or directory: config.json</i>. Самая вероятная причина?',o:['Относительный путь: у сервиса другая текущая папка — нужен WorkingDirectory или абсолютный путь','Нет интернета','systemd не умеет читать JSON','Нужен reboot'],a:0,e:'В терминале ты стоял в /opt/shop. Сервис стартует из /. Указать WorkingDirectory=/opt/shop.'},
 {t:'c',g:'prac',q:'В терминале приложение видит <code>DB_PASSWORD</code>, а как сервис — нет. Почему?',o:['Сервис не читает твой ~/.bashrc и export — переменные нужно задать в unit (Environment= / EnvironmentFile=)','Сервисам запрещены переменные','Пароль удалился','Нужно перезагрузить сервер'],a:0,e:'Окружение сервиса задаётся в unit-файле, а не в твоей оболочке.'},
 {t:'c',g:'prac',q:'Сервер ночью сам перезагрузился. Как увидеть, что было в журнале перед перезагрузкой?',o:['journalctl -b -1 (если журнал постоянный — есть /var/log/journal)','journalctl -f','systemctl status','dmesg после перезагрузки'],a:0,e:'-b -1 — прошлая загрузка. Если журнал хранится только в памяти, он уже потерян — поэтому включают постоянное хранение.'},
 {t:'i',g:'prac',fix:true,q:'Исправь строку unit-файла: сервис не стартует, в журнале <i>Executable path is not absolute</i>.',code:'ExecStart=node app.js',a:['ExecStart=/usr/bin/node /opt/shop/app.js','ExecStart=/usr/bin/node app.js'],ph:'ExecStart=…',e:'Путь к программе — абсолютный (узнать: which node). Путь к app.js лучше тоже абсолютный, либо WorkingDirectory.'},
 {t:'s',g:'job',q:'Тимлид: «shop не работает». Собери порядок разбора.',p:['systemctl status shop — состояние, код выхода, последние строки','journalctl -u shop -n 100 --no-pager — что было перед падением','Проверить зависимости из лога (база, порт, файлы, права)','Исправить причину','sudo systemctl restart shop и journalctl -u shop -f'],e:'Состояние → журнал → причина → исправление → проверка. Без догадок.'},
 {t:'c',g:'job',q:'Нужно, чтобы nginx мог открыть больше файлов (LimitNOFILE). Как правильно?',o:['sudo systemctl edit nginx → в override добавить [Service] LimitNOFILE=65535 → restart','Отредактировать /lib/systemd/system/nginx.service','Переустановить nginx','Прописать в ~/.bashrc'],a:0,e:'Drop-in переживёт обновление пакета. systemctl edit сам сделает daemon-reload.'},
 {t:'c',g:'job',q:'Бэкап через cron молча не работает, а вывод теряется. Чем помогут systemd-таймеры?',o:['Вывод сам идёт в журнал, list-timers показывает прошлый/следующий запуск, status — результат','Таймеры быстрее cron','Таймеры не требуют скрипта','Таймеры работают без systemd'],a:0,e:'Для диагностики это главное: journalctl -u backup покажет вывод и ошибки каждого запуска.'},
 {t:'c',g:'job',q:'Ты поправил конфиг nginx на проде. Что безопаснее?',o:['nginx -t, затем systemctl reload nginx','systemctl restart nginx сразу','systemctl stop, потом start','reboot'],a:0,e:'Проверка синтаксиса + мягкое перечитывание. При ошибке в конфиге reload не уронит работающий nginx.'}],
lab:[
 {t:'Разведка: найди все упавшие юниты, все включённые сервисы, посмотри unit-файл ssh или cron через <code>systemctl cat</code> и объясни каждую строку секции [Service].',sol:C(`systemctl --failed
systemctl list-unit-files --type=service --state=enabled
systemctl cat cron`)},
 {t:'Сервис своими руками: напиши скрипт <code>/opt/heartbeat/beat.sh</code>, который раз в 5 секунд печатает «alive» и время. Сделай из него сервис heartbeat от своего пользователя с Restart=on-failure, включи автозапуск, найди его вывод в журнале.',sol:C(`sudo mkdir -p /opt/heartbeat
printf '#!/usr/bin/env bash\\nwhile true; do echo "alive $(date +%%T)"; sleep 5; done\\n' | sudo tee /opt/heartbeat/beat.sh
sudo chmod +x /opt/heartbeat/beat.sh
sudo tee /etc/systemd/system/heartbeat.service <<EOF
[Unit]
Description=Heartbeat demo
[Service]
User=$USER
ExecStart=/opt/heartbeat/beat.sh
Restart=on-failure
RestartSec=3
[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload && sudo systemctl enable --now heartbeat
journalctl -u heartbeat -f`)},
 {t:'Проверь самовосстановление: убей процесс сервиса через <code>kill -9</code> и посмотри, что сделает systemd. Потом останови штатно <code>systemctl stop</code> — поднимется ли он теперь? Почему разница?',sol:'<p>После kill -9 сервис «упал» (сигнал) → Restart=on-failure поднимет его через 3 с (в журнале видно). systemctl stop — штатная остановка, это не failure → не перезапускается.</p>'},
 {t:'Сломай и почини: поставь в unit <code>ExecStart=beat.sh</code> (без пути), сделай daemon-reload и restart. Прочитай ошибку в status и journalctl, почини.'},
 {t:'Таймер вместо cron: сделай таймер, который каждые 2 минуты пишет <code>df -h /</code> в журнал. Найди его в <code>list-timers</code> и вывод в <code>journalctl</code>.',sol:C(`sudo tee /etc/systemd/system/diskcheck.service <<'EOF'
[Service]
Type=oneshot
ExecStart=/usr/bin/df -h /
EOF
sudo tee /etc/systemd/system/diskcheck.timer <<'EOF'
[Timer]
OnCalendar=*:0/2
[Install]
WantedBy=timers.target
EOF
sudo systemctl daemon-reload && sudo systemctl enable --now diskcheck.timer
systemctl list-timers | grep diskcheck
journalctl -u diskcheck -n 20`)},
 {t:'Включи постоянный журнал (если <code>/var/log/journal</code> нет), перезагрузись (в WSL: <code>wsl --shutdown</code> из Windows) и посмотри журнал прошлой загрузки.',sol:C(`sudo mkdir -p /var/log/journal && sudo systemctl restart systemd-journald
journalctl --list-boots
journalctl -b -1 -n 30`)+'<p>В WSL systemd должен быть включён: в <code>/etc/wsl.conf</code> секция <code>[boot]</code> со строкой <code>systemd=true</code> (в свежих Ubuntu для WSL уже так).</p>'}],
qa:[
 ['Что такое systemd и зачем он нужен?','Система инициализации, PID 1. Запускает сервисы при загрузке в правильном порядке, перезапускает упавшие, управляет ими через systemctl, собирает логи в журнал.'],
 ['Разница enable и start, reload и restart?','start — запустить сейчас, enable — автозапуск при загрузке. restart — остановить и запустить (рвёт соединения), reload — перечитать конфиг без остановки.'],
 ['Из чего состоит unit-файл сервиса?','[Unit] — описание и зависимости (After, Wants); [Service] — ExecStart, User, WorkingDirectory, Environment, Restart; [Install] — WantedBy для enable.'],
 ['Сервис не стартует. Что делаешь?','systemctl status (состояние, код выхода, хвост лога) → journalctl -u сервис -n 100 → проверяю зависимости, пути, права, переменные → исправляю → restart и смотрю журнал.'],
 ['Почему программа работает из терминала, но не как сервис?','У сервиса другое окружение: нет ~/.bashrc и export, другой PATH, текущая папка, пользователь. Нужны абсолютные пути, WorkingDirectory, EnvironmentFile, правильный User.'],
 ['Зачем daemon-reload?','systemd держит конфигурацию юнитов в памяти. После правки unit-файла нужно перечитать, иначе используется старая версия.'],
 ['systemd timer или cron?','Таймер: вывод в журнале, видно прошлый/следующий запуск и результат, Persistent для пропущенных запусков, зависимости. Cron: проще и привычнее. Оба встречаются.'],
 ['Как посмотреть логи перед перезагрузкой?','journalctl -b -1, если журнал постоянный (/var/log/journal существует). Иначе он был только в памяти и потерян.']],
cheat:[['systemctl status svc','состояние + хвост лога'],['sudo systemctl enable --now svc','автозапуск и запуск'],['sudo systemctl restart / reload svc','перезапуск / перечитать конфиг'],['sudo systemctl daemon-reload','после правки unit'],['systemctl --failed','упавшие юниты'],['systemctl cat svc','показать unit-файл'],['sudo systemctl edit svc','свой override'],['journalctl -u svc -f','лог сервиса в реальном времени'],['journalctl -u svc --since "1 hour ago"','лог за час'],['journalctl -p err -b','ошибки текущей загрузки'],['journalctl -b -1','прошлая загрузка'],['systemctl list-timers','таймеры']]});
