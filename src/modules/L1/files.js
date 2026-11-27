/* files · L1 · Иерархия ФС и работа с файлами */
MOD({id:'files',title:'Файлы и иерархия ФС',sub:'Где что лежит на сервере (/etc, /var, /opt…) и как читать, копировать, искать файлы.',
case:`<p>В 2 часа ночи приходит алерт: «Диск на web-01 заполнен на 95%». Через час сервер встанет: база не сможет писать. Утром другая задача: «Поменяй порт в конфиге приложения». Где этот конфиг? Где логи? Что можно удалять, а что — нельзя ни в коем случае?</p><p class="goal"><b>Цель модуля:</b> на любом незнакомом сервере за минуту находить конфиги, логи и данные сервисов, читать огромные файлы, искать файлы по имени и размеру, безопасно копировать и править — с бэкапом и путём отката.</p>`,
intro:`<p>В Linux нет дисков C: и D: — есть <b>одно дерево</b>, которое растёт из корня <code>/</code>. Все диски, флешки и даже информация о процессах «подвешены» в это дерево в виде папок.</p>
<p>У каждой папки есть назначение, и оно <mark>одинаковое на всех серверах</mark> (стандарт FHS — Filesystem Hierarchy Standard, «какая папка для чего»). Поэтому на незнакомом сервере ты сразу знаешь: конфиги — в <code>/etc</code>, логи — в <code>/var/log</code>, данные сервисов — в <code>/var/lib</code>.</p>
<p>Принцип «<b>всё есть файл</b>»: конфиг — файл, лог — файл, диск — файл в <code>/dev</code>, сведения о процессе — файлы в <code>/proc</code>. Значит, одни и те же <code>cat</code>, <code>grep</code>, <code>tail</code> работают со всем.</p>`,
theory:`<h2>Карта файловой системы</h2>
${tbl(['Папка','Что там','Пример'],[
 ['<code>/etc</code>','<mark>конфиги</mark> системы и сервисов','<code>/etc/nginx/nginx.conf</code>, <code>/etc/ssh/sshd_config</code>'],
 ['<code>/var/log</code>','<mark>логи</mark>','<code>/var/log/nginx/error.log</code>, <code>/var/log/syslog</code>'],
 ['<code>/var/lib</code>','данные сервисов (меняются в работе)','<code>/var/lib/docker</code>, <code>/var/lib/postgresql</code>'],
 ['<code>/opt</code>','сторонние приложения, часто — твой сервис','<code>/opt/app</code>'],
 ['<code>/home</code>','домашние папки пользователей','<code>/home/deploy/.ssh</code>'],
 ['<code>/root</code>','домашняя папка root','<code>/root/.bashrc</code>'],
 ['<code>/usr/bin</code>, <code>/bin</code>','программы (в современных системах /bin → /usr/bin)','<code>/usr/bin/ls</code>'],
 ['<code>/tmp</code>','временные файлы, могут удаляться при перезагрузке','—'],
 ['<code>/proc</code>, <code>/sys</code>','<b>виртуальные</b>: ядро показывает своё состояние в виде файлов','<code>/proc/cpuinfo</code>, <code>/proc/1234/</code>'],
 ['<code>/dev</code>','устройства','<code>/dev/sda</code>, <code>/dev/null</code>'],
 ['<code>/boot</code>','ядро и загрузчик','<code>/boot/vmlinuz-…</code>'],
 ['<code>/mnt</code>, <code>/media</code>','точки монтирования дисков','—']])}
${BOX('Как запомнить','<p><b>etc</b> — «настройки», <b>var</b> — «variable», то, что меняется в работе (логи, данные), <b>opt</b> — «optional», то, что поставили сверху. Сервер сломался → смотришь <code>/var/log</code>, хочешь поменять поведение → <code>/etc</code>.</p>')}
<h2>Чтение файлов</h2>
${CMDS([['cat file','вывести целиком (только для маленьких файлов)'],['less file','листать: / — поиск, n — дальше, G — в конец, q — выход'],['head -n 20 file','первые 20 строк'],['tail -n 50 file','последние 50 строк'],['tail -f app.log','следить, как дописывается лог (Ctrl+C — выйти)'],['tail -F app.log','то же, но переживает ротацию лога (файл пересоздали)'],['wc -l file','сколько строк'],['file x','что это за файл: текст, бинарник, архив'],['stat file','размер, права, владелец, даты изменения']])}
<h2>Создание, копирование, удаление</h2>
${CMDS([['touch a.txt','создать пустой файл (или обновить дату)'],['mkdir -p a/b/c','создать папки вместе с родителями'],['cp a.txt b.txt','копировать файл'],['cp -r src/ dst/','копировать папку (рекурсивно)'],['cp -a src/ dst/','копировать с сохранением прав, владельца и дат (для бэкапов)'],['mv old new','переместить или <b>переименовать</b>'],['rm file','удалить файл'],['rm -r dir/','удалить папку со всем содержимым'],['ln -s target link','символическая ссылка (ярлык)']])}
${BOX('Корзины нет','<p><code>rm</code> удаляет сразу и навсегда. <code>rm -rf</code> не спрашивает подтверждения и не жалуется на ошибки. Перед удалением — <code>ls</code> того же пути. Особенно опасно с переменной: если <code>$DIR</code> пустая, <code>rm -rf $DIR/*</code> превращается в <code>rm -rf /*</code> — удаление всего содержимого корня (защита rm --preserve-root спасает только от голого <code>/</code>, но не от <code>/*</code>).</p>','warn')}
<h2>Поиск файлов</h2>
${C(`find /etc -name "*.conf"                # по имени (кавычки обязательны!)
find /var/log -name "*.log" -mtime +7    # изменённые больше 7 дней назад
find / -size +500M 2>/dev/null           # больше 500 МБ, ошибки доступа скрыть
find /opt/app -type d                    # только папки (-type f — только файлы)`)}
<p>Шаблоны <code>*</code> (любые символы) и <code>?</code> (один символ) раскрывает <b>оболочка</b> до запуска команды. Поэтому в <code>find -name</code> шаблон берут в кавычки — иначе bash раскроет его сам по файлам текущей папки.</p>
<h2>Символические ссылки</h2>
${C(`
$ ls -l /etc/nginx/sites-enabled/
lrwxrwxrwx 1 root root 34 May 3 myapp -> /etc/nginx/sites-available/myapp
`,'term')}
<p>Буква <b>l</b> в начале и стрелка <code>-&gt;</code> — это ссылка. Nginx включает сайт ссылкой из <code>sites-enabled</code> на файл в <code>sites-available</code>: удалил ссылку — сайт выключен, а конфиг остался.</p>`,
memo:`<p>Зайди на свою Ubuntu и пройди по карте: открой по одному файлу из <code>/etc</code>, <code>/var/log</code>, <code>/proc</code>. Для каждой папки скажи вслух, что там лежит. Потом найди через <code>find</code> 5 самых больших файлов в системе.</p>`,
traps:[
 ['cat /var/log/syslog на 2 ГБ','less /var/log/syslog или tail -n 200','cat вывалит гигабайты в терминал, и SSH-сессия «зависнет». Большие файлы читаем постранично или с конца.'],
 ['find / -name *.log','find / -name "*.log"','Без кавычек bash раскроет *.log по текущей папке ещё до запуска find, и поиск будет не тот (или ошибка).'],
 ['cp /etc/nginx /backup/','cp -r /etc/nginx /backup/ (а лучше cp -a)','Без -r папки не копируются: «omitting directory». -a ещё и сохраняет права и владельца.'],
 ['rm -rf $APP_DIR/* без проверки','[ -n "$APP_DIR" ] && rm -rf "$APP_DIR"/* — и сначала ls','Пустая переменная превращает команду в rm -rf /* — удаление всего. Кавычки защищают имена с пробелами.'],
 ['tail -f на лог, который ротируется','tail -F','После ротации старый файл переименован, -f продолжает читать его и «молчит». -F переоткрывает файл по имени.']],
ex:[
 {t:'c',q:'Где лежат конфигурационные файлы системы и сервисов?',o:['/etc','/var','/opt','/usr/bin'],a:0,e:'/etc — конфиги: /etc/nginx, /etc/ssh, /etc/hosts.'},
 {t:'c',q:'Где искать логи nginx в первую очередь?',o:['/var/log/nginx','/etc/nginx/log','/opt/nginx','/tmp/nginx'],a:0,e:'Логи — в /var/log: access.log и error.log.'},
 {t:'c',q:'Где Docker хранит образы и данные контейнеров по умолчанию?',o:['/var/lib/docker','/etc/docker','/opt/docker','/home/docker'],a:0,e:'/var/lib — изменяемые данные сервисов. В /etc/docker лежит только конфиг daemon.json.'},
 {t:'c',q:'Что такое <code>/proc</code>?',o:['Виртуальная ФС: ядро показывает процессы и своё состояние как файлы','Папка с программами','Папка с логами процессов','Временные файлы'],a:0,e:'/proc не хранится на диске. /proc/cpuinfo, /proc/meminfo, /proc/&lt;pid&gt;/ — живые данные ядра.'},
 {t:'c',q:'Какая команда подходит, чтобы <b>следить</b> за логом в реальном времени?',o:['tail -f','head -f','cat -f','less -n'],a:0,e:'tail -f дописывает новые строки по мере появления. Выход — Ctrl+C.'},
 {t:'c',q:'Как переименовать файл <code>app.conf</code> в <code>app.conf.bak</code>?',o:['mv app.conf app.conf.bak','rename app.conf','cp -r app.conf','ln app.conf.bak'],a:0,e:'Отдельной команды rename в базе нет: переименование = перемещение в то же место под новым именем.'},
 {t:'i',q:'Впиши команду: создать папки <code>/opt/app/releases/v1</code> одним махом, даже если родителей нет.',a:['mkdir -p /opt/app/releases/v1'],ph:'mkdir …',e:'-p создаёт всю цепочку и не ругается, если папка уже есть.'},
 {t:'i',q:'Впиши команду: показать последние 100 строк файла <code>/var/log/syslog</code>.',a:['tail -n 100 /var/log/syslog','tail -100 /var/log/syslog','tail -n100 /var/log/syslog'],ph:'tail …',e:'tail -n 100 — последние 100 строк. По умолчанию tail показывает 10.'},
 {t:'i',q:'Впиши команду: скопировать папку <code>conf</code> в <code>conf.bak</code> с сохранением прав и владельца.',a:['cp -a conf conf.bak','cp -a conf/ conf.bak','cp -a conf/ conf.bak/','cp -rp conf conf.bak'],ph:'cp …',e:'-a (archive) = рекурсивно + права + владелец + даты + ссылки. Для бэкапов конфигов — то, что нужно.'},
 {t:'i',q:'Впиши команду: найти в <code>/etc</code> все файлы с именем, оканчивающимся на <code>.conf</code>.',a:['find /etc -name "*.conf"',"find /etc -name '*.conf'",'find /etc -type f -name "*.conf"',"find /etc -type f -name '*.conf'"],ph:'find …',e:'Шаблон в кавычках, чтобы его разобрал find, а не bash.'},
 {t:'s',q:'Собери путь к главному конфигу nginx.',p:['/etc','/nginx','/nginx.conf'],e:'/etc/nginx/nginx.conf — главный конфиг. Сайты — в /etc/nginx/sites-available и sites-enabled.'},
 {t:'r',q:'Что это за объект?',code:`$ ls -l /etc/nginx/sites-enabled/
lrwxrwxrwx 1 root root 34 May  3 10:12 shop -> /etc/nginx/sites-available/shop`,lang:'term',o:['Символическая ссылка на файл в sites-available','Обычный файл конфига','Папка','Сломанный файл'],a:0,e:'l в первом символе и стрелка -> — symlink. Конфиг живёт в sites-available, ссылка включает сайт.'},
 {t:'r',q:'Почему ничего не скопировалось?',code:`$ cp /etc/nginx /root/backup/
cp: -r not specified; omitting directory '/etc/nginx'`,lang:'term',o:['Это папка, нужен флаг -r (или -a)','Нет прав root','Папки /root/backup нет','nginx запущен и файл занят'],a:0,e:'cp без -r копирует только файлы. Папки — cp -r или cp -a.'},
 {t:'c',g:'prac',q:'Сервис пишет лог 3 ГБ. Ты хочешь найти в нём первое упоминание <code>timeout</code>. Что лучше?',o:['less app.log, потом /timeout','cat app.log','head app.log','nano app.log'],a:0,e:'less не грузит файл целиком в терминал и умеет искать. cat вывалит 3 ГБ, редактор может съесть всю память.'},
 {t:'c',g:'prac',q:'Что произойдёт: <code>rm -rf $DIR/*</code>, если переменная <code>DIR</code> пустая?',o:['Команда станет rm -rf /* — удаление всего содержимого корня','Ничего, rm проверит пустую переменную','Удалится текущая папка','Будет ошибка синтаксиса'],a:0,e:'Оболочка подставит пустоту → rm -rf /*, а bash раскроет /* в /bin /etc /home … Защита: проверять переменную, set -u в скриптах, кавычки "$DIR".'},
 {t:'c',g:'prac',q:'Лог nginx ротируется каждую ночь (logrotate). Утром <code>tail -f access.log</code> перестал показывать новые строки. Почему и что делать?',o:['tail -f держит старый файл; нужен tail -F','nginx перестал писать логи','Закончилось место','Нужен sudo'],a:0,e:'logrotate переименовал файл, nginx пишет в новый, а tail -f читает старый. -F следит за именем и переоткрывает.'},
 {t:'i',g:'prac',q:'Впиши команду: найти файлы больше 1 ГБ во всей системе, ошибки «Permission denied» скрыть.',a:['find / -size +1G 2>/dev/null','find / -type f -size +1G 2>/dev/null'],ph:'find / …',e:'-size +1G — больше гигабайта. 2>/dev/null — выбросить ошибки (поток ошибок подробно — в модуле «Потоки»).'},
 {t:'i',g:'prac',fix:true,q:'Исправь команду: найти логи старше 7 дней.',code:'find /var/log -name *.log -mtime 7',a:['find /var/log -name "*.log" -mtime +7',"find /var/log -name '*.log' -mtime +7",'find /var/log -type f -name "*.log" -mtime +7'],ph:'find …',e:'Шаблон в кавычки; -mtime +7 — больше 7 суток. -mtime 7 значит «ровно 7».'},
 {t:'c',g:'job',q:'Нужно поправить конфиг сайта nginx. Какой файл редактировать?',o:['Файл в /etc/nginx/sites-available (ссылка из sites-enabled укажет на него)','Ссылку в sites-enabled удалить и создать файл','/var/log/nginx/access.log','/opt/nginx/site'],a:0,e:'Редактируем оригинал. Ссылка в sites-enabled просто включает его. Правку проверить nginx -t (модуль Nginx).'},
 {t:'s',g:'job',q:'Перед правкой прод-конфига. Собери безопасный порядок.',p:['Сделать копию: cp -a app.conf app.conf.bak','Отредактировать app.conf','Проверить синтаксис (например, nginx -t)','Применить (reload сервиса)','Если сломалось — вернуть из .bak'],e:'Бэкап → правка → проверка → применение → путь отката. Так делают всегда, не только с nginx.'},
 {t:'c',g:'job',q:'Где на сервере искать твоё приложение, если его ставили вручную, не из пакета?',o:['Чаще всего /opt/&lt;имя&gt; (или /srv, /home/&lt;пользователь&gt;)','/proc','/boot','/dev'],a:0,e:'/opt — для стороннего софта и самописных сервисов. Узнать наверняка: посмотреть unit-файл systemd (модуль systemd).'},
 {t:'c',g:'job',q:'Где посмотреть, сколько ядер у процессора, если нет утилит?',o:['cat /proc/cpuinfo','cat /etc/cpu','ls /dev/cpu','cat /var/log/cpu'],a:0,e:'/proc/cpuinfo, /proc/meminfo — ядро отдаёт данные как файлы. Быстрее: nproc.'}],
lab:[
 {t:'Экскурсия: найди и открой на своей машине (1) конфиг SSH-сервера или клиента, (2) системный лог, (3) информацию о памяти от ядра, (4) файл с соответствием имён и IP. Для каждого — полный путь.',h:'<p>Смотри карту: /etc, /var/log, /proc. Файл имён — hosts.</p>',sol:C(`less /etc/ssh/ssh_config       # (sshd_config — если стоит сервер)
less /var/log/syslog           # в WSL может быть пусто — тогда journalctl
cat /proc/meminfo
cat /etc/hosts`)},
 {t:'В <code>~/lab</code> создай 30 файлов <code>log1.log … log30.log</code>, папку <code>archive</code>. Перемести туда все логи с номерами 1–9, потом найди <code>find</code>-ом все <code>.log</code> вне archive.',h:'<p>Скобки <code>{1..30}</code> раскрывает bash. Шаблон <code>log?.log</code> — один символ.</p>',sol:C(`cd ~/lab && touch log{1..30}.log && mkdir -p archive
mv log?.log archive/
find . -name "*.log" -not -path "./archive/*"`)},
 {t:'Включи «сайт» как в nginx: создай <code>~/lab/sites-available/shop</code>, сделай на него ссылку в <code>~/lab/sites-enabled/</code>, проверь <code>ls -l</code>. Удали ссылку и убедись, что оригинал жив. Затем удали оригинал при живой ссылке и посмотри, что покажет <code>cat</code> по ссылке.',sol:C(`mkdir -p ~/lab/sites-available ~/lab/sites-enabled
echo "server {}" > ~/lab/sites-available/shop
ln -s ~/lab/sites-available/shop ~/lab/sites-enabled/shop
ls -l ~/lab/sites-enabled/
rm ~/lab/sites-enabled/shop && cat ~/lab/sites-available/shop   # оригинал на месте`)+'<p>Если удалить оригинал — ссылка «висит» (dangling) и cat скажет No such file.</p>'},
 {t:'Найди 5 самых больших файлов в <code>/var</code>. Пока не знаешь <code>sort</code> — используй <code>find -size</code> и уменьшай порог, пока не останется несколько файлов.',sol:C(`sudo find /var -type f -size +100M 2>/dev/null
# после модуля «Текст» это делается одной строкой:
sudo du -ah /var 2>/dev/null | sort -rh | head -5`)}],
qa:[
 ['Что лежит в /etc, /var, /opt?','/etc — конфиги. /var — изменяемые данные: /var/log (логи), /var/lib (данные сервисов: docker, postgres). /opt — сторонний и самописный софт.'],
 ['Что такое /proc?','Виртуальная файловая система: ядро показывает состояние процессов (/proc/&lt;pid&gt;) и системы (cpuinfo, meminfo, loadavg). На диске не хранится.'],
 ['Что значит «всё есть файл»?','Устройства, процессы, сокеты, конфиги представлены как файлы. Поэтому одни и те же инструменты (cat, grep, tail) работают со всем.'],
 ['tail -f и tail -F?','-f следит за дескриптором открытого файла; после ротации читает старый. -F следит за именем и переоткрывает файл — для логов с logrotate.'],
 ['Что такое символическая ссылка?','Файл-указатель на путь другого файла. Если оригинал удалить, ссылка повиснет. Пример — sites-enabled в nginx. Жёсткая ссылка (ln без -s) — второе имя тех же данных.'],
 ['Как найти, что съело диск?','df -h — какой раздел заполнен; du -sh /* и глубже — какая папка; find / -size +1G — крупные файлы. Подробно — модуль «Сервер тормозит».']],
cheat:[['less file','листать, / — поиск'],['tail -f / -F log','следить за логом'],['head -n 20 file','начало файла'],['mkdir -p a/b/c','папки с родителями'],['cp -a src dst','копия с правами'],['mv old new','переместить / переименовать'],['rm -r dir','удалить папку'],['ln -s target link','символьная ссылка'],['find /etc -name "*.conf"','поиск по имени'],['find / -size +1G 2>/dev/null','большие файлы'],['stat file','метаданные файла']]});
