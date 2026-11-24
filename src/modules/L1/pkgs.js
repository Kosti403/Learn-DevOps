/* pkgs · L1 · Пакеты: apt, dpkg, репозитории, ключи, версии, обновления безопасности */
MOD({id:'pkgs',title:'Пакеты: apt, репозитории, версии',sub:'Как софт попадает на сервер, откуда, какой версии — и как обновлять, ничего не сломав.',
case:`<p>Утром приходит новость: в OpenSSL нашли критическую уязвимость, нужно срочно обновить все серверы. Ты делаешь <code>apt upgrade</code> — и заодно обновляется ещё 140 пакетов, среди них Postgres, и прод встаёт. На другом сервере коллега пытается поставить Docker: <code>apt install docker-ce</code> → <i>Unable to locate package</i>. В интернете советуют «просто выполни <code>curl https://… | sudo bash</code>». А сканер безопасности ругается, что у вас «старая версия OpenSSL 3.0.2», хотя вы обновлялись вчера.</p><p class="goal"><b>Цель модуля:</b> понимать, откуда берутся программы на сервере, ставить их из правильных источников, точечно обновлять нужное (особенно безопасность), фиксировать версии и не путаться в «старых» номерах версий в Ubuntu.</p>`,
intro:`<p><b>Пакет</b> — это архив с программой: файлы, которые надо разложить по системе (<code>/usr/bin</code>, <code>/etc</code>…), плюс описание — версия, от каких других пакетов зависит, какие скрипты выполнить при установке. В Ubuntu пакеты — файлы <code>.deb</code>.</p>
<p><b>Репозиторий</b> — сервер-склад пакетов с подписанным списком всего, что там лежит. <b>apt</b> — программа, которая знает, какие склады подключены, скачивает список, находит нужный пакет и <mark>сама ставит всё, от чего он зависит</mark>.</p>
<p>Зачем это DevOps-у: любой сервер, Dockerfile и CI-раннер начинается с установки пакетов. Ошибка здесь — это и сломанный прод после «обновил всё подряд», и дыра в безопасности из-за пакета из непроверенного источника.</p>`,
theory:`<h2>Как всё устроено</h2>
${C(`
 Репозитории (archive.ubuntu.com, download.docker.com …)
        │  список пакетов, подписанный ключом GPG
        ▼
 apt update      → скачать свежие СПИСКИ (сами программы не трогает)
        ▼
 /var/lib/apt/lists/   ← локальная копия списков
        ▼
 apt install nginx → найти пакет + зависимости → скачать .deb → dpkg распаковывает и настраивает
`,'out')}
<p><b>dpkg</b> — нижний уровень: ставит и удаляет конкретный <code>.deb</code>, но зависимостей не ищет. <b>apt</b> — верхний: работает с репозиториями и зависимостями, а для самой установки вызывает dpkg.</p>
<h2>Основные команды</h2>
${CMDS([['sudo apt update','обновить <b>списки</b> пакетов (делать перед install/upgrade)'],['sudo apt install nginx','установить с зависимостями'],['sudo apt install nginx=1.24.0-2ubuntu7','установить конкретную версию'],['sudo apt remove nginx','удалить программу, конфиги в /etc оставить'],['sudo apt purge nginx','удалить вместе с конфигами'],['sudo apt autoremove','удалить зависимости, которые больше никому не нужны'],['apt list --upgradable','что можно обновить'],['sudo apt upgrade','обновить всё установленное (ничего не удаляет)'],['sudo apt install --only-upgrade openssl','обновить только один пакет'],['apt search nginx','найти пакет'],['apt show nginx','описание, версия, зависимости'],['apt policy nginx','какая версия стоит, какая доступна и из какого репозитория']])}
${CMDS([['dpkg -l | grep nginx','установлен ли пакет и какая версия'],['dpkg -L nginx','какие файлы поставил пакет'],['dpkg -S /usr/sbin/nginx','какому пакету принадлежит файл'],['sudo apt install ./app_1.0_amd64.deb','поставить скачанный .deb <b>с зависимостями</b> (./ обязательно)']])}
<h2>Откуда apt берёт пакеты</h2>
${C(`
$ cat /etc/apt/sources.list.d/ubuntu.sources
Types: deb
URIs: http://archive.ubuntu.com/ubuntu/
Suites: noble noble-updates noble-backports
Components: main restricted universe multiverse
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg
`,'term')}
${tbl(['Что','Значит'],[
 ['<b>noble</b>','кодовое имя Ubuntu 24.04 (модуль [[mod:linux]]): пакеты на момент выхода'],
 ['<b>noble-updates</b>','исправления ошибок после выхода'],
 ['<b>noble-security</b>','<mark>патчи безопасности</mark> (отдельный адрес security.ubuntu.com)'],
 ['<b>main</b> / <b>restricted</b>','поддерживает Canonical: открытое / проприетарные драйверы'],
 ['<b>universe</b> / <b>multiverse</b>','поддерживает сообщество / несвободные лицензии'],
 ['<b>Signed-By</b>','ключ, которым проверяется подпись списка: подменённый репозиторий не пройдёт']])}
<p>В Ubuntu 24.04 источники лежат в <code>/etc/apt/sources.list.d/*.sources</code>; в старых версиях — одной строкой в <code>/etc/apt/sources.list</code>.</p>
<h2>Сторонний репозиторий — правильно</h2>
<p>Свежий Docker, PostgreSQL новее, чем в Ubuntu, GitLab Runner ставят из репозиториев их разработчиков. Порядок всегда одинаковый:</p>
${C(`# 1. ключ разработчика — в отдельный файл
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
# 2. источник, который разрешено проверять только этим ключом (signed-by)
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list
# 3. обновить списки и ставить
sudo apt update && sudo apt install docker-ce`)}
${BOX('Почему не curl … | sudo bash','<p>Такая команда выполняет от root скрипт, которого ты не видел, прямо из интернета. Если сайт взломан или адрес с опечаткой — ты сам отдал серверу команду. Минимум — скачать скрипт, прочитать, потом запустить. Лучше — репозиторий с ключом, как выше: каждый пакет проверяется подписью. Старый способ <code>apt-key add</code> устарел: ключ становился доверенным <b>для всех</b> репозиториев сразу.</p>','warn')}
<h2>Версии в Ubuntu: почему «старая» версия может быть свежей</h2>
${C(`
$ apt policy openssl
openssl:
  Installed: 3.0.13-0ubuntu3.4
  Candidate: 3.0.13-0ubuntu3.4
`,'term')}
<p>В LTS-версии Ubuntu номер версии программы <b>заморожен</b> (3.0.13), а исправления безопасности <mark>переносятся внутрь той же версии</mark> (backport). Меняется только хвост: <code>-0ubuntu3.4</code>. Поэтому сканер, который смотрит лишь на «3.0.13», может кричать об уязвимости, которая уже закрыта. Проверять надо по базе Ubuntu (ubuntu.com/security/cves), а не по номеру upstream-версии.</p>
<h2>Обновления без сюрпризов</h2>
${CMDS([['apt list --upgradable','сначала посмотреть, что обновится'],['sudo apt install --only-upgrade openssl libssl3t64','срочно закрыть одну уязвимость, не трогая остальное'],['sudo apt-mark hold postgresql-16','запретить обновление пакета (unhold — снять)'],['apt-mark showhold','что заморожено'],['cat /var/run/reboot-required','нужна ли перезагрузка (обновилось ядро или libc)'],['systemctl status unattended-upgrades','автоматические обновления безопасности']])}
<p><b>unattended-upgrades</b> в Ubuntu по умолчанию сам ставит патчи безопасности. Из-за него бывает ошибка <i>Could not get lock /var/lib/dpkg/lock-frontend</i>: идёт фоновое обновление. Решение — подождать (<code>ps aux | grep -i apt</code>), а <mark>не удалять lock-файл</mark> — так можно сломать базу пакетов.</p>
<h2>То же в других дистрибутивах и в Docker</h2>
${tbl(['Действие','Ubuntu/Debian','RHEL/Rocky','Alpine'],[['обновить списки','<code>apt update</code>','<code>dnf makecache</code>','<code>apk update</code>'],['установить','<code>apt install x</code>','<code>dnf install x</code>','<code>apk add x</code>'],['удалить','<code>apt remove x</code>','<code>dnf remove x</code>','<code>apk del x</code>'],['чей файл','<code>dpkg -S</code>','<code>rpm -qf</code>','<code>apk info --who-owns</code>']])}
${C(`# Dockerfile: update и install — в одном RUN, списки — удалить
RUN apt-get update \\
 && apt-get install -y --no-install-recommends curl ca-certificates \\
 && rm -rf /var/lib/apt/lists/*`)}
<p>В скриптах и Dockerfile пишут <code>apt-get</code>: у него стабильный вывод, а <code>apt</code> рассчитан на человека (сам предупреждает об этом).</p>`,
memo:`<p>Для любого пакета на своём сервере научись отвечать на четыре вопроса: какая версия стоит (<code>apt policy</code>), из какого репозитория (там же), какие файлы он поставил (<code>dpkg -L</code>), кто от него зависит. И правило обновления: сначала <code>apt list --upgradable</code>, потом решение — обновлять всё, точечно или заморозить.</p>`,
traps:[
 ['apt install … → «Unable to locate package» и паника','sudo apt update, потом install (и проверить, подключён ли нужный репозиторий)','Списки пакетов устарели или пакета нет в подключённых репозиториях — его нужно добавить.'],
 ['apt update — «я обновил систему»','apt update — только списки; обновляет программы apt upgrade','Распространённая путаница на собесах. update ничего не ставит.'],
 ['curl https://get.example.com | sudo bash','Репозиторий с ключом (signed-by) или скачать скрипт, прочитать, потом выполнить','Выполняешь от root непрочитанный код из сети.'],
 ['Удалить /var/lib/dpkg/lock-frontend, «чтобы apt заработал»','Подождать фоновое обновление (unattended-upgrades) — ps aux | grep apt','Два dpkg одновременно портят базу пакетов. Lock защищает от этого.'],
 ['Срочный патч OpenSSL через apt upgrade на проде','apt install --only-upgrade openssl libssl3t64','upgrade обновит всё подряд, включая базу и рантаймы — риск сломать прод в момент инцидента.'],
 ['Сканер: «OpenSSL 3.0.13 уязвим» — значит, не обновлено','Сверить полную версию пакета (-0ubuntu3.4) с базой Ubuntu CVE','Ubuntu переносит патчи в замороженную версию. Номер upstream не меняется.']],
ex:[
 {t:'c',q:'Что делает <code>apt update</code>?',o:['Обновляет списки пакетов из репозиториев, сами программы не меняет','Обновляет все программы','Обновляет Ubuntu до новой версии','Удаляет старые пакеты'],a:0,e:'Программы обновляет apt upgrade. update — только «каталог».'},
 {t:'c',q:'Чем <code>apt remove</code> отличается от <code>apt purge</code>?',o:['purge удаляет ещё и конфиги','remove удаляет конфиги, purge нет','Ничем','purge удаляет зависимости'],a:0,e:'После remove конфиги в /etc остаются — при повторной установке подхватятся. Зависимости чистит autoremove.'},
 {t:'c',q:'Чем dpkg отличается от apt?',o:['dpkg ставит конкретный .deb без поиска зависимостей; apt работает с репозиториями и зависимостями','Ничем','apt — для Red Hat','dpkg скачивает из интернета'],a:0,e:'apt — надстройка, которая для установки вызывает dpkg.'},
 {t:'c',q:'Что означает <code>noble-security</code> в источниках?',o:['Репозиторий патчей безопасности для Ubuntu 24.04','Платная версия Ubuntu','Антивирус','Тестовые пакеты'],a:0,e:'noble — 24.04. -updates — исправления ошибок, -security — безопасность.'},
 {t:'c',q:'Зачем у стороннего репозитория указывают <code>signed-by=/etc/apt/keyrings/docker.asc</code>?',o:['Чтобы списки этого репозитория проверялись только ключом Docker','Чтобы ускорить скачивание','Чтобы пакеты ставились без sudo','Это необязательный комментарий'],a:0,e:'Ключ доверен только для своего источника. Подменённый список не пройдёт проверку.'},
 {t:'c',q:'Как apt ведёт себя при ошибке <i>Could not get lock /var/lib/dpkg/lock-frontend</i>?',o:['Сейчас работает другой apt/dpkg (часто unattended-upgrades) — нужно подождать','Пакет повреждён','Нужно удалить lock-файл','Кончилось место'],a:0,e:'Lock не даёт двум установщикам портить базу одновременно.'},
 {t:'i',q:'Впиши: узнать, какому пакету принадлежит файл <code>/usr/bin/curl</code>.',a:['dpkg -S /usr/bin/curl','dpkg-query -S /usr/bin/curl'],ph:'dpkg …',e:'dpkg -S — search по файлу. Обратное — dpkg -L пакет.'},
 {t:'i',q:'Впиши: посмотреть, какая версия nginx установлена, какая доступна и откуда.',a:['apt policy nginx','apt-cache policy nginx'],ph:'apt …',e:'Installed, Candidate и список репозиториев с приоритетами.'},
 {t:'i',q:'Впиши: обновить только пакет <code>openssl</code>, не трогая остальные.',a:['sudo apt install --only-upgrade openssl','apt install --only-upgrade openssl','sudo apt-get install --only-upgrade openssl','sudo apt install --only-upgrade -y openssl'],ph:'sudo apt …',e:'--only-upgrade: обновить, только если пакет уже установлен; остальное не трогать.'},
 {t:'i',q:'Впиши: запретить обновление пакета <code>postgresql-16</code>.',a:['sudo apt-mark hold postgresql-16','apt-mark hold postgresql-16'],ph:'sudo apt-mark …',e:'hold — заморозить, unhold — разморозить, showhold — список.'},
 {t:'i',q:'Впиши: поставить скачанный файл <code>app_1.0_amd64.deb</code> из текущей папки вместе с зависимостями.',a:['sudo apt install ./app_1.0_amd64.deb','apt install ./app_1.0_amd64.deb','sudo apt install -y ./app_1.0_amd64.deb'],ph:'sudo apt …',e:'./ обязательно — иначе apt будет искать пакет с таким именем в репозиториях. dpkg -i поставил бы файл, но без зависимостей.'},
 {t:'s',q:'Собери порядок подключения стороннего репозитория.',p:['Скачать ключ разработчика в /etc/apt/keyrings/','Добавить источник с signed-by в /etc/apt/sources.list.d/','sudo apt update','sudo apt install пакет','apt policy пакет — убедиться, что версия из нужного репозитория'],e:'Ключ → источник → списки → установка → проверка происхождения.'},
 {t:'r',q:'Почему не ставится?',code:`$ sudo apt install docker-ce
Reading package lists... Done
E: Unable to locate package docker-ce`,lang:'term',o:['Пакета нет в подключённых репозиториях — нужно добавить репозиторий Docker (и apt update)','Нет интернета','Пакет повреждён','Нужно запускать без sudo'],a:0,e:'docker-ce есть только в репозитории Docker. В Ubuntu свой пакет — docker.io.'},
 {t:'r',q:'Что покажет этот вывод?',code:`$ apt policy nginx
nginx:
  Installed: 1.24.0-2ubuntu7
  Candidate: 1.26.2-1~noble
  Version table:
     1.26.2-1~noble 500
        500 http://nginx.org/packages/ubuntu noble/nginx amd64 Packages
 *** 1.24.0-2ubuntu7 500
        500 http://archive.ubuntu.com/ubuntu noble/main amd64 Packages`,lang:'term',o:['Стоит версия из Ubuntu, а при обновлении поставится 1.26 из репозитория nginx.org','Стоит версия с nginx.org','Обновление невозможно','nginx не установлен'],a:0,e:'*** — установленная. Candidate — что поставит apt upgrade. Решение о переходе на чужой репозиторий — осознанное.'},
 {t:'r',q:'Нужно ли что-то сделать после обновления?',code:`$ sudo apt upgrade -y
...
$ cat /var/run/reboot-required
*** System restart required ***`,lang:'term',o:['Да: обновилось ядро или системная библиотека — нужна перезагрузка в удобное окно','Нет, всё применилось','Нужно переустановить пакеты','Нужно apt update'],a:0,e:'Новое ядро заработает только после перезагрузки. Планируй её, а не делай посреди дня без предупреждения.'},
 {t:'c',g:'prac',q:'Срочно закрыть уязвимость в OpenSSL на проде. Что разумнее?',o:['apt update, затем apt install --only-upgrade openssl libssl3t64, перезапустить сервисы, использующие библиотеку','apt upgrade -y — обновить всё','apt purge openssl','Ждать плановых работ'],a:0,e:'Точечно и быстро. Сервисы, которые уже загрузили старую библиотеку в память, нужно перезапустить (needrestart подскажет какие).'},
 {t:'c',g:'prac',q:'Сканер говорит, что OpenSSL 3.0.13 уязвим к CVE, а у тебя стоит <code>3.0.13-0ubuntu3.4</code>. Что делаешь?',o:['Проверяю CVE в базе Ubuntu: патч мог быть перенесён в эту версию пакета','Сразу ставлю OpenSSL из исходников','Удаляю OpenSSL','Игнорирую сканер'],a:0,e:'Ubuntu делает backport патчей. Сканеры, смотрящие только на upstream-версию, дают ложные срабатывания.'},
 {t:'c',g:'prac',q:'Инструкция в интернете: <code>curl -fsSL https://get.tool.sh | sudo bash</code>. Как поступить?',o:['Скачать скрипт, прочитать, понять, что он делает; лучше — найти официальный репозиторий с ключом','Выполнить, раз в инструкции','Выполнить без sudo','Выполнить дважды для надёжности'],a:0,e:'Непрочитанный код от root — плохая привычка, особенно на проде.'},
 {t:'i',g:'prac',fix:true,q:'Исправь строку Dockerfile: образ раздувается, а иногда ставятся устаревшие версии.',code:'RUN apt-get install -y curl',a:['RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*','RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*'],ph:'RUN …',e:'update и install в одном слое (иначе кэш слоя со старыми списками), без рекомендованных пакетов, списки удалить.'},
 {t:'s',g:'job',q:'Плановое обновление прод-сервера. Собери безопасный порядок.',p:['Снимок/бэкап сервера и базы','sudo apt update && apt list --upgradable — что изменится','Заморозить критичное, если обновлять его сейчас нельзя: apt-mark hold','sudo apt upgrade','Проверить сервисы: systemctl --failed, сайт отвечает','Если /var/run/reboot-required — перезагрузка в согласованное окно'],e:'Бэкап → посмотреть → ограничить → обновить → проверить → перезагрузить по плану.'},
 {t:'c',g:'job',q:'Где на сервере посмотреть историю установок и обновлений пакетов (кто что и когда ставил)?',o:['/var/log/apt/history.log (и /var/log/dpkg.log)','/etc/apt/sources.list','journalctl -u nginx','~/.bash_history'],a:0,e:'history.log показывает команду, время, пользователя и что поменялось. Помогает ответить «что изменилось перед поломкой» (модуль [[mod:res]]).'},
 {t:'c',g:'job',q:'Нужен Postgres 17, а в Ubuntu 24.04 только 16. Правильный путь?',o:['Подключить официальный репозиторий PostgreSQL (apt.postgresql.org) с ключом и поставить postgresql-17','Скачать случайный .deb с форума','Обновить Ubuntu до интерима','Собрать из исходников на проде'],a:0,e:'Официальный репозиторий разработчика: подписанные пакеты, обновления безопасности. Вариант с Docker-образом postgres:17 — тоже норм, будет в уровне 2.'}],
lab:[
 {t:'Разведка пакетов: узнай, сколько пакетов установлено, какие репозитории подключены, кому принадлежат <code>/usr/bin/ls</code> и <code>/usr/sbin/sshd</code> (или ssh), какие файлы ставит пакет <code>coreutils</code>.',sol:C(`dpkg -l | grep -c '^ii'
ls /etc/apt/sources.list.d/ && cat /etc/apt/sources.list.d/*.sources
dpkg -S /usr/bin/ls; dpkg -S "$(which ssh)"
dpkg -L coreutils | head -30`)},
 {chk:'<p>После remove в <code>dpkg -l | grep htop</code> пакет будет в статусе <code>rc</code> (удалён, конфиги остались). После purge строки не будет совсем. autoremove уберёт зависимости, которые ставились только ради удалённого пакета.</p>',t:'Полный цикл: поставь <code>htop</code> и <code>tree</code>, посмотри <code>apt show</code> и <code>apt policy</code>, удали через remove, проверь, остались ли конфиги, сделай purge и autoremove.'},
 {t:'Сторонний репозиторий с ключом: подключи официальный репозиторий Docker по инструкции из теории (своими руками, без копирования одной строкой — разбери каждую часть), поставь <code>docker-ce</code>, проверь <code>apt policy docker-ce</code>, откуда он.',h:'<p>Если не хочешь ставить Docker сейчас — достаточно дойти до apt update и apt policy docker-ce: Candidate должен быть из download.docker.com.</p>'},
 {t:'Обновления: посмотри <code>apt list --upgradable</code>, заморозь один пакет через hold, сделай upgrade и убедись, что он не обновился. Найди своё обновление в <code>/var/log/apt/history.log</code>. Проверь, нужна ли перезагрузка.',sol:C(`apt list --upgradable
sudo apt-mark hold tree && apt-mark showhold
sudo apt upgrade -y
grep -A4 "Start-Date" /var/log/apt/history.log | tail -20
[ -f /var/run/reboot-required ] && cat /var/run/reboot-required || echo "reboot не нужен"
sudo apt-mark unhold tree`)},
 {h:'<p>На ubuntu.com/security/cves открой нужную CVE: внизу таблица Package / Release / Status — для noble (24.04) указана версия пакета, в которой уязвимость закрыта. Сравни её со своей <code>apt policy openssl</code> (строка Installed).</p>',t:'Найди информацию о любой свежей CVE в OpenSSL на ubuntu.com/security и сравни с версией пакета у себя (<code>apt policy openssl</code>): закрыта ли она в твоей версии? Запиши, как ты это определил.'}],
qa:[
 ['Чем apt update отличается от apt upgrade?','update — скачивает свежие списки пакетов из репозиториев. upgrade — обновляет установленные программы до версий из этих списков. full-upgrade ещё и удаляет/добавляет пакеты при изменении зависимостей.'],
 ['Что такое репозиторий и как apt проверяет его подлинность?','Сервер с пакетами и подписанным индексом. apt проверяет подпись ключом GPG (Signed-By/signed-by); подменённый индекс не примется.'],
 ['Как подключить сторонний репозиторий правильно?','Ключ — в /etc/apt/keyrings, источник с signed-by в sources.list.d, apt update, install, проверить apt policy. apt-key устарел, curl | bash — плохая практика.'],
 ['dpkg vs apt?','dpkg ставит/удаляет конкретный .deb без зависимостей и ведёт базу установленного. apt — репозитории, зависимости, обновления; внутри вызывает dpkg.'],
 ['Как зафиксировать версию пакета?','apt install pkg=версия и apt-mark hold pkg. В Dockerfile — явная версия в install.'],
 ['Почему в Ubuntu «старые» версии пакетов?','LTS замораживает версии, а патчи безопасности переносит внутрь (backport) — меняется суффикс версии. Уязвимость проверяют по базе Ubuntu CVE, а не по upstream-номеру.'],
 ['Как срочно закрыть уязвимость в одной библиотеке?','apt update, apt install --only-upgrade пакеты, перезапустить сервисы, использующие библиотеку (needrestart), проверить /var/run/reboot-required.'],
 ['Что такое unattended-upgrades?','Служба автоматической установки обновлений безопасности в Ubuntu. Из-за неё бывает занят lock dpkg — ждать, а не удалять lock.']],
cheat:[['sudo apt update','обновить списки'],['sudo apt install pkg','установить'],['sudo apt install pkg=ver','конкретная версия'],['sudo apt remove / purge pkg','удалить / с конфигами'],['sudo apt autoremove','лишние зависимости'],['apt list --upgradable','что обновится'],['sudo apt install --only-upgrade pkg','обновить один пакет'],['apt policy pkg','версии и источник'],['apt show pkg','описание и зависимости'],['dpkg -L pkg','файлы пакета'],['dpkg -S /path','чей файл'],['sudo apt-mark hold pkg','заморозить версию'],['cat /var/run/reboot-required','нужна ли перезагрузка'],['less /var/log/apt/history.log','история установок']]});
