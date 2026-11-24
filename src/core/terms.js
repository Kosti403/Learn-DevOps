/* Словарь инструментов. Если инструмент встречается в модуле РАНЬШЕ своего модуля (m),
   движок сам покажет вверху модуля короткое объяснение (d). Раздел «Словарь» (#terms) — все сразу.
   k — ключ, n — название, re — как искать в тексте модуля, d — что это и зачем (1–3 предложения), m — id модуля, где разобрано подробно. */
const TERMS=[
 {k:'nginx',n:'Nginx',re:/nginx/i,m:'nginx',d:'Веб-сервер: принимает HTTP-запросы из интернета, сам отдаёт файлы сайта (картинки, HTML) или передаёт запрос твоему приложению. Стоит «на входе» почти любого сайта. На каждый запрос пишет строку в лог <code>/var/log/nginx/access.log</code>, ошибки — в <code>error.log</code>.'},
 {k:'http',n:'HTTP и коды ответа',re:/HTTP|\b(?:403|404|500|502)\b/,m:'dns',d:'Протокол, по которому браузер разговаривает с сайтом: запрос (GET /page) → ответ с кодом. 2xx — успех (200 OK), 3xx — перенаправление, 4xx — ошибка клиента (404 не найдено, 403 запрещено), 5xx — ошибка сервера (500, 502).'},
 {k:'docker',n:'Docker и контейнер',re:/docker|контейнер/i,m:'docker',d:'Docker запускает приложения в <b>контейнерах</b> — изолированных процессах со своим набором файлов (образом). Контейнер легче виртуальной машины: у него нет своего ядра, он использует ядро хоста.'},
 {k:'compose',n:'Docker Compose',re:/compose/i,m:'compose',d:'Запуск нескольких контейнеров (приложение + база + nginx) одной командой по описанию в файле <code>docker-compose.yml</code>.'},
 {k:'cron',n:'cron',re:/cron/i,m:'bash2',d:'Планировщик: запускает команды по расписанию. Строка <code>0 3 * * * /opt/backup.sh</code> = «каждый день в 3:00». Вывод заданий никто не видит, поэтому его перенаправляют в лог.'},
 {k:'logrotate',n:'logrotate и ротация логов',re:/logrotate|ротац/i,m:'text',d:'Чтобы логи не съели диск, их «ротируют»: раз в сутки <code>access.log</code> переименовывается в <code>access.log.1</code>, старые сжимаются (<code>.gz</code>) и удаляются, а приложение пишет в новый пустой файл.'},
 {k:'systemd',n:'systemd / systemctl',re:/systemd|systemctl|unit-файл/i,m:'systemd',d:'Система, которая запускает и следит за сервисами: стартует nginx при загрузке, перезапускает упавшее приложение. Управление — <code>systemctl start|stop|restart|status имя</code>.'},
 {k:'journalctl',n:'journalctl',re:/journalctl/i,m:'systemd',d:'Чтение журнала systemd — логов всех сервисов в одном месте. <code>journalctl -u nginx</code> — логи сервиса nginx.'},
 {k:'cicd',n:'CI/CD и пайплайн',re:/\bCI\b|CI\/CD|пайплайн|pipeline/i,m:'gitlabci',d:'Автоматизация: при каждом push сервер сборки сам собирает код, гоняет тесты (CI) и выкатывает на сервер (CD). Шаги описываются в файле, например <code>.gitlab-ci.yml</code>. Шаг (job) падает, если команда вернула ненулевой код.'},
 {k:'git',n:'Git',re:/\bgit\b/i,m:'git',d:'Система контроля версий: хранит историю изменений кода. <code>git pull</code> — забрать свежие изменения с сервера, <code>git push</code> — отправить свои.'},
 {k:'ssh',n:'SSH',re:/\bssh\b/i,m:'ssh',d:'Защищённое подключение к удалённому серверу: <code>ssh user@host</code> даёт терминал на сервере. Вход по паролю или по ключу (пара файлов: приватный у тебя, публичный на сервере).'},
 {k:'curl',n:'curl',re:/curl/i,m:'net1',d:'Консольный HTTP-клиент: отправляет запрос и показывает ответ. <code>curl http://localhost:8080</code> — «открыть страницу» без браузера; удобно проверять, жив ли сервис.'},
 {k:'k8s',n:'Kubernetes',re:/kubernetes|k8s|kubectl/i,m:'k8sarch',d:'Оркестратор: управляет сотнями контейнеров на многих серверах, сам перезапускает упавшие, распределяет нагрузку, обновляет без простоя.'},
 {k:'postgres',n:'PostgreSQL',re:/postgres/i,m:'sql',d:'Популярная база данных. Работает как сервис от системного пользователя <code>postgres</code>, данные хранит в <code>/var/lib/postgresql</code>.'},
 {k:'wsl',n:'WSL',re:/\bWSL\b/,m:'linux',d:'Windows Subsystem for Linux — настоящая Ubuntu внутри Windows. Ставится одной командой <code>wsl --install</code>; самый быстрый способ получить полигон.'},
 {k:'vps',n:'VPS / VM',re:/\bVPS\b|VirtualBox|виртуальн/i,m:'ctr',d:'Виртуальная машина — программная имитация компьютера со своей ОС. VPS — такая машина в аренду в дата-центре, с постоянным IP. VirtualBox — программа для VM на своём компьютере.'},
 {k:'apt',n:'apt / dnf / apk',re:/\bapt\b|\bdnf\b|\bapk\b/,m:'pkgs',d:'Менеджеры пакетов — «магазин приложений» в консоли: <code>apt install nginx</code> скачивает и ставит программу со всеми зависимостями. apt — Ubuntu/Debian, dnf — RHEL, apk — Alpine.'},
 {k:'sysctl',n:'sysctl',re:/sysctl/i,m:'res',d:'Настройки ядра «на лету» (размер буферов сети, swappiness и т. п.). Постоянные значения кладут в <code>/etc/sysctl.d/*.conf</code>.'},
 {k:'npm',n:'npm / make',re:/\bnpm\b|\bmake\b/,m:'gitlabci',d:'Инструменты сборки. <code>npm test</code> — запустить тесты проекта на Node.js, <code>make</code> — выполнить шаги сборки из Makefile. В модулях они — просто пример «долгой команды с выводом».'},
 {k:'pwsh',n:'PowerShell',re:/powershell|pwsh|\.ps1/i,m:'shell',d:'Оболочка Windows (есть и для Linux — <code>pwsh</code>). В отличие от bash передаёт по пайпам объекты, а не текст. Скрипты — файлы <code>.ps1</code>.'},
 {k:'regex',n:'Регулярные выражения',re:/регуляр|regex/i,m:'text',d:'Шаблоны для поиска текста: <code>^</code> — начало строки, <code>$</code> — конец, <code>.</code> — любой символ, <code>*</code> — повторить сколько угодно раз, <code>[0-9]</code> — цифра.'}];
const termIdx=k=>ORDER.indexOf(k);
/* Какие инструменты модуль упоминает раньше их собственного модуля */
function earlyTerms(id){const m=MODS[id],i=ORDER.indexOf(id);
  const txt=[m.intro,m.theory,m.memo,JSON.stringify(m.traps),JSON.stringify(m.ex),JSON.stringify(m.lab),JSON.stringify(m.qa)].join(' ').replace(/<[^>]+>/g,' ');
  return TERMS.filter(t=>t.m!==id&&t.re.test(txt)&&(LEVELS.flatMap(l=>l.ids).indexOf(t.m)>LEVELS.flatMap(l=>l.ids).indexOf(id)))}
const termHTML=t=>`<div class="term"><b>${t.n}</b> — ${t.d} <span class="muted">${MODS[t.m]?`→ <a href="#m-${t.m}">подробно: ${MODS[t.m].title}</a>`:'→ подробно в своём модуле (в работе)'}</span></div>`;
