/* pwsh · L1 · PowerShell для DevOps: объекты, конвейер, скрипты .ps1, ошибки, соответствия bash */
MOD({id:'pwsh',title:'PowerShell (.ps1) для DevOps',sub:'Объекты вместо текста, Get-Command / Get-Help / Get-Member, конвейер, .ps1 с параметрами, ошибки, ExecutionPolicy и шпаргалка bash ↔ PowerShell.',
case:`<p>В компании MS SQL Server стоит на Windows-серверах, а один из GitLab-раннеров — Windows-машина. Тебя просят: «Сделай скрипт, который проверит на 10 серверах, запущена ли служба SQL Server и сколько свободно на диске D:». Ты по привычке пишешь <code>ps aux | grep sql</code> — ошибка. <code>ls -la</code> — ошибка. <code>curl -s</code> в старом PowerShell — вообще не curl. Скрипт, скачанный из репозитория, не запускается: «выполнение сценариев отключено в этой системе».</p><p class="goal"><b>Цель модуля:</b> уверенно работать в PowerShell: находить нужные команды без гугла, обрабатывать вывод как объекты, писать .ps1 с параметрами и обработкой ошибок, понимать ExecutionPolicy — и переводить свои bash-привычки на PowerShell.</p>`,
intro:`<p><b>PowerShell</b> — оболочка и язык скриптов от Microsoft. Он есть в каждой Windows, а версия 7 (<code>pwsh</code>) работает и на Linux, и на macOS.</p>
<p>Главное отличие от bash: по пайпу <code>|</code> идёт <mark>не текст, а объекты</mark> со свойствами. В bash, чтобы достать из <code>ps</code> память процесса, ты вырезаешь нужную колонку через awk и надеешься, что формат не поменяется. В PowerShell у процесса просто есть свойство <code>WorkingSet</code> — сортируй, фильтруй, считай.</p>
<p>Зачем DevOps-у: Windows-серверы (MS SQL; IIS — веб-сервер Microsoft, аналог nginx; Active Directory — единая база пользователей и компьютеров компании), Azure, раннеры CI на Windows и твой собственный ноутбук. Даже если основная работа в Linux, PowerShell встретится — и лучше, чтобы bash-привычки не подводили.</p>`,
theory:`<h2>Две версии</h2>
${tbl(['','Windows PowerShell 5.1','PowerShell 7+'],[
 ['запуск','<code>powershell.exe</code>','<code>pwsh</code>'],
 ['где','встроен в Windows, больше не развивается','ставится отдельно (winget install Microsoft.PowerShell), Windows/Linux/macOS'],
 ['что брать','только если нет выбора','<mark>для новых скриптов</mark>']])}
<p>Версия: <code>$PSVersionTable.PSVersion</code>.</p>
<h2>Команды: Глагол-Существительное</h2>
<p>Все команды (cmdlet) называются <b>Verb-Noun</b>: <code>Get-Process</code>, <code>Stop-Service</code>, <code>New-Item</code>, <code>Remove-Item</code>. Зная правило, команду можно угадать. Три команды, чтобы <mark>не гуглить</mark>:</p>
${CMDS([['Get-Command *service*','найти команды по куску имени'],['Get-Help Restart-Service -Examples','справка с примерами (Update-Help — скачать полную)'],['Get-Process | Get-Member','какие у объектов свойства и методы — главная команда PowerShell']])}
<h2>Объекты в конвейере</h2>
${C(`# топ-5 процессов по памяти, только имя, PID и память в МБ
Get-Process |
  Sort-Object WorkingSet -Descending |
  Select-Object -First 5 Name, Id, @{n='MB'; e={[math]::Round($_.WorkingSet/1MB)}}

# службы SQL, которые остановлены
Get-Service *sql* | Where-Object Status -eq 'Stopped'`,'ps')}
${tbl(['Командлет','Что делает','Аналог в bash'],[
 ['<code>Where-Object</code> (<code>?</code>)','фильтр по свойству','grep / awk с условием'],
 ['<code>Sort-Object</code>','сортировка по свойству','sort -k'],
 ['<code>Select-Object</code>','выбрать свойства, -First N','cut, head'],
 ['<code>ForEach-Object</code> (<code>%</code>)','сделать что-то с каждым','while read / xargs'],
 ['<code>Measure-Object</code>','посчитать, сумма, среднее','wc -l, awk sum'],
 ['<code>Group-Object</code>','сгруппировать и посчитать','sort | uniq -c']])}
<p>Внутри блоков <code>{ }</code> текущий объект — <code>$_</code> (или <code>$PSItem</code>).</p>
<h2>Язык: переменные, сравнения, условия</h2>
${C(`$port = 3000                      # пробелы вокруг = можно (в bash — нельзя!)
$name = "shop"
"Сервис $name на порту $port"     # двойные кавычки подставляют
'Буквально $name'                 # одинарные — нет
$env:DB_HOST = 'localhost'        # переменная окружения (как export в bash)

if ($port -gt 1024 -and $name -like 'sh*') { 'ok' } elseif ($port -eq 80) { 'web' } else { 'нет' }

foreach ($s in 'web-01','web-02') { Test-Connection $s -Count 1 -Quiet }`,'ps')}
${tbl(['Сравнение','Значит'],[['<code>-eq -ne</code>','равно / не равно (<b>не</b> == и !=)'],['<code>-gt -ge -lt -le</code>','больше, ≥, меньше, ≤'],['<code>-like \'*.log\'</code>','шаблон со звёздочкой'],['<code>-match \'^err\'</code>','регулярное выражение'],['<code>-and -or -not</code>','логика'],['<code>-contains</code>','есть ли элемент в списке']])}
<p>По умолчанию сравнение строк <b>без учёта регистра</b>: <code>'ABC' -eq 'abc'</code> — True. С учётом — <code>-ceq</code>. Экранирующий символ — обратная кавычка <code>\`</code>, а не <code>\\</code>.</p>
<h2>Скрипт .ps1 с параметрами и строгими ошибками</h2>
${C(`# check-sql.ps1
param(
  [Parameter(Mandatory)] [string[]] $Servers,
  [int] $MinFreeGB = 10
)
$ErrorActionPreference = 'Stop'          # любая ошибка командлета — исключение (аналог set -e)
Set-StrictMode -Version Latest           # необъявленная переменная — ошибка (аналог set -u)

foreach ($s in $Servers) {
  try {
    $svc  = Get-Service -ComputerName $s -Name 'MSSQLSERVER'
    $disk = Get-CimInstance Win32_LogicalDisk -ComputerName $s -Filter "DeviceID='D:'"
    $free = [math]::Round($disk.FreeSpace / 1GB, 1)
    [pscustomobject]@{ Server=$s; SQL=$svc.Status; FreeGB=$free; OK=($svc.Status -eq 'Running' -and $free -ge $MinFreeGB) }
  } catch {
    Write-Error "$s : $($_.Exception.Message)"
  }
}
# запуск: .\\check-sql.ps1 -Servers db-01,db-02 -MinFreeGB 20 | Format-Table`,'ps')}
${BOX('Ошибки: $? и $LASTEXITCODE','<p>У командлетов ошибки — объекты; их ловят <code>try/catch</code> (при <code>$ErrorActionPreference = \'Stop\'</code>). У <b>внешних программ</b> (git, docker, sqlcmd, kubectl) ошибка — это только код возврата, он лежит в <code>$LASTEXITCODE</code>. <code>$ErrorActionPreference</code> на них не действует, поэтому после важных внешних команд проверяй: <code>if ($LASTEXITCODE -ne 0) { throw "docker build упал" }</code>. Это главная ловушка скриптов CI на Windows.</p>','deep')}
<h2>ExecutionPolicy</h2>
${tbl(['Политика','Значит'],[
 ['<b>Restricted</b>','скрипты запрещены (по умолчанию на клиентских Windows)'],
 ['<b>RemoteSigned</b>','свои локальные — можно; скачанные — только подписанные (по умолчанию на Windows Server)'],
 ['<b>Bypass</b>','ничего не проверять (для разового запуска в CI)']])}
${CMDS([['Get-ExecutionPolicy -List','политики по уровням'],['Set-ExecutionPolicy -Scope CurrentUser RemoteSigned','разрешить себе локальные скрипты'],['pwsh -ExecutionPolicy Bypass -File .\\deploy.ps1','запустить один раз без изменения настроек'],['Unblock-File .\\deploy.ps1','снять метку «скачано из интернета»']])}
<p>ExecutionPolicy — <b>защита от случайного запуска</b>, а не граница безопасности: её легко обойти. От злоумышленника она не защищает.</p>
<h2>Шпаргалка bash → PowerShell</h2>
${tbl(['bash','PowerShell'],[
 ['<code>ls -la</code>','<code>Get-ChildItem -Force</code> (<code>ls -Force</code>)'],
 ['<code>cat f</code> / <code>tail -f f</code>','<code>Get-Content f</code> / <code>Get-Content f -Wait -Tail 20</code>'],
 ['<code>grep error f</code>','<code>Select-String error f</code>'],
 ['<code>ps aux | grep node</code>','<code>Get-Process *node*</code>'],
 ['<code>kill PID</code>','<code>Stop-Process -Id PID</code>'],
 ['<code>curl -s url</code>','<code>Invoke-RestMethod url</code> (JSON сразу в объекты); <code>curl.exe</code> — настоящий curl'],
 ['<code>export X=1</code> / <code>echo $X</code>','<code>$env:X = 1</code> / <code>$env:X</code>'],
 ['<code>which git</code>','<code>Get-Command git</code>'],
 ['<code>nc -zv host 1433</code>','<code>Test-NetConnection host -Port 1433</code>'],
 ['<code>systemctl status/restart x</code>','<code>Get-Service x</code> / <code>Restart-Service x</code>'],
 ['<code>journalctl</code>','<code>Get-WinEvent -LogName System -MaxEvents 50</code>'],
 ['<code>df -h</code>','<code>Get-Volume</code> / <code>Get-PSDrive</code>'],
 ['<code>cmd &gt; f 2&gt;&amp;1</code>','<code>cmd *&gt; f</code> (все потоки)'],
 ['<code>ssh host cmd</code>','<code>Invoke-Command -ComputerName host { cmd }</code> (WinRM) или ssh в PS 7']])}
<p><b>WinRM</b> (Windows Remote Management) — встроенная в Windows служба удалённого управления, «SSH для Windows»: через неё PowerShell выполняет команды на других машинах. Работает на портах 5985 (HTTP) и 5986 (HTTPS), включается командой <code>Enable-PSRemoting</code>; в доменной сети вход идёт под учёткой Active Directory — общей базы пользователей и компьютеров компании.</p>
<p>В Windows PowerShell 5.1 <code>curl</code> и <code>wget</code> — <mark>алиасы</mark> Invoke-WebRequest с другими флагами. Настоящий curl — <code>curl.exe</code>.</p>
<h2>Где пригодится с MS SQL</h2>
<p>Модуль <b>dbatools</b> (<code>Install-Module dbatools -Scope CurrentUser</code>) — сотни командлетов для администрирования SQL Server: <code>Get-DbaDatabase</code>, <code>Backup-DbaDatabase</code>, <code>Test-DbaLastBackup</code> (проверить, что бэкап реально восстанавливается). Его используют DBA и DevOps по всему миру — пригодится в проекте.</p>`,
memo:`<p>Неделю делай повседневное на Windows только в PowerShell 7 (<code>pwsh</code>). Для каждой незнакомой задачи: <code>Get-Command *слово*</code> → <code>Get-Help … -Examples</code> → <code>… | Get-Member</code>. И каждый раз, когда хочется вырезать колонку из текста, вспоминай: тут это свойство объекта.</p>`,
traps:[
 ['ls -la, ps aux в PowerShell','Get-ChildItem -Force, Get-Process','ls и ps тут — алиасы других команд с другими параметрами.'],
 ['if ($a == 5)','if ($a -eq 5)','== в PowerShell нет; = — присваивание. Сравнение — -eq, -gt, -like…'],
 ['$ErrorActionPreference = "Stop" — значит, упавший docker build остановит скрипт','if ($LASTEXITCODE -ne 0) { throw … } после внешних команд','Настройка действует на командлеты. Внешние программы сообщают об ошибке только кодом в $LASTEXITCODE.'],
 ['curl -s https://… в Windows PowerShell 5.1','Invoke-RestMethod или curl.exe','curl там — алиас Invoke-WebRequest, флаг -s он не знает.'],
 ['Set-ExecutionPolicy Unrestricted на сервере, «чтобы работало»','Разовый запуск: pwsh -ExecutionPolicy Bypass -File …, или RemoteSigned для CurrentUser','Не ослабляй политику для всей машины ради одного скрипта.'],
 ['Get-Process | Select-String node, как grep','Get-Process | Where-Object Name -like \'*node*\'','Фильтруй по свойствам объекта, а не по тексту — надёжнее и быстрее.']],
ex:[
 {t:'c',q:'Чем конвейер PowerShell отличается от bash?',o:['По пайпу идут объекты со свойствами, а не текст','Ничем','PowerShell не умеет пайпы','В PowerShell пайп только для файлов'],a:0,e:'Поэтому не надо вырезать колонки awk — берёшь свойство.'},
 {t:'c',q:'Как называются команды PowerShell?',o:['Глагол-Существительное: Get-Process, Restart-Service','Существительное-глагол','Как в bash: ps, kill','Только аббревиатурами'],a:0,e:'Verb-Noun. Список разрешённых глаголов: Get-Verb.'},
 {t:'c',q:'Какая команда показывает свойства и методы объектов из конвейера?',o:['Get-Member','Get-Help','Get-Command','Select-Object'],a:0,e:'Get-Process | Get-Member — увидеть, что вообще можно фильтровать и сортировать.'},
 {t:'c',q:'Как в PowerShell проверить «равно»?',o:['-eq','==','=','.equals'],a:0,e:'В PowerShell знаки заняты: > — перенаправление, = — присваивание. Поэтому сравнения пишут словами: -eq, -ne, -gt, -lt, -like (шаблон), -match (регулярное выражение). Оператора == в PowerShell нет.'},
 {t:'c',q:'Где лежит код возврата внешней программы (docker, git) в PowerShell?',o:['$LASTEXITCODE','$?','$Error','$ExitCode'],a:0,e:'$? — успех последней операции (True/False). Числовой код внешней программы — $LASTEXITCODE.'},
 {t:'c',q:'Политика выполнения <b>RemoteSigned</b> означает…',o:['Локальные скрипты можно, скачанные — только подписанные','Все скрипты запрещены','Все разрешены','Только удалённые'],a:0,e:'Restricted — все запрещены, Bypass — ничего не проверяется.'},
 {t:'c',q:'Что такое <code>$_</code>?',o:['Текущий объект в блоке Where-Object / ForEach-Object','Последний код возврата','Домашняя папка','Аргументы скрипта'],a:0,e:'Внутри блока { } у Where-Object и ForEach-Object $_ — это объект, который сейчас идёт по конвейеру. Например, $_.Name — имя текущего процесса. Длинное имя той же переменной — $PSItem.'},
 {t:'i',q:'Впиши: найти все команды, в имени которых есть <code>service</code>.',a:['Get-Command *service*','gcm *service*','Get-Command -Name *service*'],ph:'Get-Command …',e:'Звёздочки — шаблон. Дальше Get-Help имя -Examples.'},
 {t:'i',q:'Впиши: показать последние 20 строк файла <code>app.log</code> и следить за новыми (аналог tail -f).',a:['Get-Content app.log -Wait -Tail 20','Get-Content .\\app.log -Wait -Tail 20','Get-Content -Path app.log -Tail 20 -Wait','gc app.log -Wait -Tail 20','Get-Content app.log -Tail 20 -Wait'],ph:'Get-Content …',e:'-Tail N — последние строки, -Wait — ждать новых.'},
 {t:'i',q:'Впиши: проверить, открыт ли порт 1433 на сервере <code>db-01</code>.',a:['Test-NetConnection db-01 -Port 1433','Test-NetConnection -ComputerName db-01 -Port 1433','tnc db-01 -Port 1433'],ph:'Test-NetConnection …',e:'TcpTestSucceeded : True — порт доступен. Первое, что проверяешь при «приложение не видит базу».'},
 {t:'i',q:'Впиши: задать переменную окружения <code>DB_HOST</code> со значением <code>localhost</code> для текущей сессии.',a:["$env:DB_HOST = 'localhost'",'$env:DB_HOST = "localhost"',"$env:DB_HOST='localhost'",'$env:DB_HOST="localhost"'],ph:'$env:…',e:'Переменные окружения в PowerShell лежат на «диске» env:, поэтому пишутся как $env:ИМЯ. Это аналог export DB_HOST=localhost в bash. Действует в текущей сессии и в программах, запущенных из неё.'},
 {t:'s',q:'Собери конвейер: 5 процессов, которые больше всего едят памяти.',p:['Get-Process','| Sort-Object WorkingSet -Descending','| Select-Object -First 5 Name, Id, WorkingSet'],e:'Сортировка по свойству → первые 5 → нужные свойства.'},
 {t:'s',q:'Собери начало строгого скрипта .ps1 с параметром.',p:['param([Parameter(Mandatory)][string]$Env)',"$ErrorActionPreference = 'Stop'",'Set-StrictMode -Version Latest'],e:'param — первым. Потом «падать на ошибках» и «падать на необъявленных переменных».'},
 {t:'r',q:'Почему скрипт не запустился?',code:`PS C:\\scripts> .\\deploy.ps1
.\\deploy.ps1 : Невозможно загрузить файл C:\\scripts\\deploy.ps1, так как выполнение
сценариев отключено в этой системе.
PS C:\\scripts> Get-ExecutionPolicy
Restricted`,lang:'out',o:['Политика Restricted: разово запустить pwsh -ExecutionPolicy Bypass -File .\\deploy.ps1 или разрешить RemoteSigned для себя','Скрипт повреждён','Нужен bash','Нет прав администратора на файл'],a:0,e:'Restricted — по умолчанию на клиентских Windows.'},
 {t:'r',q:'Почему шаг CI на Windows-раннере «зелёный», хотя сборка упала?',code:`$ErrorActionPreference = 'Stop'
docker build -t shop .
Write-Host "build done"`,lang:'ps',o:['docker — внешняя программа: её код в $LASTEXITCODE не проверен, ErrorActionPreference на неё не действует','Write-Host скрывает ошибки','docker не работает в PowerShell','Нужен try/catch вокруг Write-Host'],a:0,e:'После внешней команды: if ($LASTEXITCODE -ne 0) { throw "build failed" }. (В PS 7.4+ есть $PSNativeCommandUseErrorActionPreference = $true.)'},
 {t:'r',q:'Что вернёт команда?',code:`PS> Get-Service *sql* | Where-Object Status -eq 'Running' | Measure-Object | Select-Object -ExpandProperty Count
2`,lang:'out',o:['Количество запущенных служб, в имени которых есть sql — их 2','Имена служб','Статус первой службы','Ошибку'],a:0,e:'Фильтр по свойству → подсчёт → вытащить число Count.'},
 {t:'c',g:'prac',q:'Нужно получить JSON от API и вывести поле <code>status</code>. Как в PowerShell проще всего?',o:['(Invoke-RestMethod https://api/health).status','curl https://api/health | jq .status','Invoke-WebRequest и разбирать текст регуляркой','Get-Content https://api/health'],a:0,e:'Invoke-RestMethod сам превращает JSON в объект.'},
 {t:'c',g:'prac',q:'Нужно выполнить команду на 5 Windows-серверах сразу. Что использовать?',o:['Invoke-Command -ComputerName s1,s2,… -ScriptBlock { … }','foreach + Enter-PSSession','RDP на каждый','ssh в цикле через cmd'],a:0,e:'Invoke-Command (WinRM) выполняет блок параллельно и возвращает объекты с полем PSComputerName.'},
 {t:'i',g:'prac',fix:true,q:'Исправь условие: должно сработать, если свободно меньше 10 ГБ.',code:'if ($freeGB < 10) { Write-Warning "мало места" }',a:['if ($freeGB -lt 10) { Write-Warning "мало места" }',"if ($freeGB -lt 10) { Write-Warning 'мало места' }"],ph:'if (…) { … }',e:'< в PowerShell — перенаправление (зарезервировано), а не сравнение. Нужно -lt.'},
 {t:'c',g:'job',q:'Нужно регулярно проверять, что бэкапы MS SQL реально восстанавливаются. Что разумно взять в PowerShell?',o:['Модуль dbatools: Test-DbaLastBackup','Get-ChildItem по папке бэкапов','Ничего — если файл есть, значит, всё ок','Invoke-RestMethod'],a:0,e:'Test-DbaLastBackup восстанавливает последний бэкап на тестовый сервер и проверяет целостность. Наличие файла — не доказательство.'},
 {t:'c',g:'job',q:'Скрипт пишут для Windows и для Linux-раннеров. Что выбрать?',o:['PowerShell 7 (pwsh) — он кроссплатформенный','Windows PowerShell 5.1','cmd.exe','Два разных скрипта всегда'],a:0,e:'pwsh есть на всех платформах. Учти различия путей (/ и \\) и регистра в Linux.'},
 {t:'c',g:'job',q:'Коллега предлагает выполнить на сервере <code>Set-ExecutionPolicy Unrestricted -Scope LocalMachine</code>, чтобы раннер запускал скрипты. Что лучше?',o:['Запускать в CI через pwsh -ExecutionPolicy Bypass -File …, не меняя политику машины','Согласиться','Отключить антивирус','Переписать всё на bat'],a:0,e:'Минимальное изменение: политика только для конкретного запуска. Машину не ослабляем.'}],
lab:[
 {t:'Поставь PowerShell 7 и сравни версии: <code>winget install Microsoft.PowerShell</code>, потом в обоих (powershell и pwsh) выполни <code>$PSVersionTable.PSVersion</code>. Посмотри свою ExecutionPolicy по уровням.',sol:C(`winget install Microsoft.PowerShell
$PSVersionTable.PSVersion
Get-ExecutionPolicy -List`,'ps')},
 {t:'Разведка без гугла: найди командлет, который показывает IP-адреса сетевых интерфейсов, и командлет, который показывает свободное место на дисках. Используй только Get-Command, Get-Help и Get-Member.',h:'<p>Существительные: NetIPAddress, Volume.</p>',sol:C(`Get-Command *ipaddress*
Get-NetIPAddress -AddressFamily IPv4 | Select-Object InterfaceAlias, IPAddress
Get-Volume | Select-Object DriveLetter, @{n='FreeGB';e={[math]::Round($_.SizeRemaining/1GB,1)}}`,'ps')},
 {t:'Перепиши на PowerShell однострочники из модулей [[mod:text]] и [[mod:res]]: топ-5 процессов по CPU; сколько файлов .log в папке и их общий размер в МБ; строки с «error» в файле с номерами.',sol:C(`Get-Process | Sort-Object CPU -Descending | Select-Object -First 5 Name, Id, CPU
Get-ChildItem C:\\Windows\\Logs -Recurse -Filter *.log -ErrorAction SilentlyContinue |
  Measure-Object Length -Sum | ForEach-Object { "{0} файлов, {1:N1} МБ" -f $_.Count, ($_.Sum/1MB) }
Select-String -Path .\\app.log -Pattern error | Select-Object LineNumber, Line`,'ps')},
 {t:'Скрипт <code>check.ps1</code>: параметр <code>-Services</code> (массив имён служб), строгий режим, для каждой службы — объект {Name, Status}, в конце — код выхода 1, если хоть одна не Running. Запусти: <code>pwsh -File .\\check.ps1 -Services Spooler,wuauserv; $LASTEXITCODE</code>.',sol:C(`param([Parameter(Mandatory)][string[]]$Services)
$ErrorActionPreference = 'Stop'; Set-StrictMode -Version Latest
$bad = 0
foreach ($s in $Services) {
  $svc = Get-Service -Name $s
  [pscustomobject]@{ Name = $svc.Name; Status = $svc.Status }
  if ($svc.Status -ne 'Running') { $bad++ }
}
exit ([int]($bad -gt 0))`,'ps')},
 {chk:'<p>Без проверки «готово» напечатается, хотя git вернул ошибку: $ErrorActionPreference на внешние программы не действует. С <code>if ($LASTEXITCODE -ne 0) { throw "git упал" }</code> скрипт остановится.</p>',t:'Ловушка внешних команд: напиши скрипт с <code>$ErrorActionPreference = \'Stop\'</code>, где выполняется <code>git status</code> в папке, которая не является репозиторием, а потом печатается «готово». Убедись, что «готово» печатается. Добавь проверку $LASTEXITCODE и убедись, что теперь скрипт падает.'}],
qa:[
 ['Чем PowerShell отличается от bash?','По пайпу передаются объекты, а не текст: фильтруешь и сортируешь по свойствам. Команды Verb-Noun, сравнения -eq/-gt, переменные с $ и при присвоении. Есть встроенная справка и Get-Member.'],
 ['Как найти нужную команду без интернета?','Get-Command *слово*, Get-Help команда -Examples, объект | Get-Member — посмотреть свойства.'],
 ['Что такое ExecutionPolicy?','Политика запуска скриптов: Restricted, RemoteSigned, Bypass и др. Защищает от случайного запуска, но не является границей безопасности. В CI — pwsh -ExecutionPolicy Bypass -File.'],
 ['Как обрабатывать ошибки в PowerShell-скрипте?','$ErrorActionPreference = "Stop" + try/catch для командлетов; для внешних программ проверять $LASTEXITCODE; Set-StrictMode для необъявленных переменных.'],
 ['PowerShell 5.1 или 7?','5.1 встроен в Windows и не развивается. 7 (pwsh) — кроссплатформенный, быстрее, новые возможности. Новые скрипты — под 7.'],
 ['Как выполнить команду на удалённых Windows-серверах?','Invoke-Command -ComputerName … -ScriptBlock {…} через WinRM (параллельно), Enter-PSSession — интерактивно. В PS 7 можно и через SSH.'],
 ['Чем полезен PowerShell для MS SQL?','Модуль dbatools: бэкапы, восстановление, миграции, проверка бэкапов (Test-DbaLastBackup), инвентаризация серверов — сотни готовых командлетов.']],
cheat:[['Get-Command *x*','найти команду'],['Get-Help cmd -Examples','примеры'],['obj | Get-Member','свойства объекта'],['Where-Object Prop -eq v','фильтр'],['Sort-Object Prop -Descending','сортировка'],['Select-Object -First 5 A,B','выбрать'],['Get-Content f -Wait -Tail 20','tail -f'],['Select-String err f','grep'],['Invoke-RestMethod url','HTTP + JSON'],['Test-NetConnection h -Port 1433','проверить порт'],['$env:X = 1','переменная окружения'],['$LASTEXITCODE','код внешней программы'],["$ErrorActionPreference = 'Stop'",'падать на ошибках'],['pwsh -ExecutionPolicy Bypass -File x.ps1','разовый запуск']]});
