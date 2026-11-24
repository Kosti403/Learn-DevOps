/* Полезные ссылки из заметок. mod — id модулей, где ссылка показывается в блоке «Почитать по теме» (модуль может быть ещё в плане — тогда ссылка появится, когда он будет готов).
   g — раздел на странице #links. Темы статей без подписи не проверялись — они в разделе «Общее». */
const LINKS=[
 {g:'Общее',t:'BoostMentor — гайд по DevOps',u:'https://boostmentor.ru/guides/devops',n:'опорный гайд курса: план тем и вопросы',mod:[]},
 {g:'Общее',t:'Ultimate DevOps Guide (GitHub)',u:'https://github.com/boost-mentor/ultimate-devops-guide',n:'тот же гайд в репозитории',mod:[]},
 {g:'Общее',t:'Habr: статья (в заметках — «Habr DevOps»)',u:'https://habr.com/ru/articles/865040/',n:'тема не проверялась',mod:[]},
 {g:'Общее',t:'Habr, МКБ (в заметках — «Habr MKB»)',u:'https://habr.com/ru/companies/mkb/articles/852280/',n:'тема не проверялась',mod:[]},
 {g:'Общее',t:'Habr, VK: статья 1',u:'https://habr.com/ru/companies/vk/articles/792368/',n:'тема не проверялась',mod:[]},
 {g:'Общее',t:'Habr, VK: статья 2',u:'https://habr.com/ru/companies/vk/articles/809447/',n:'тема не проверялась',mod:[]},
 {g:'Контейнеры и Kubernetes',t:'Видео: Kubernetes с нуля (по нему идут уровни 2–3)',u:'https://www.youtube.com/watch?v=6mhlHDJOQAw',n:'тайм-коды разложены по модулям в ROADMAP',mod:['ctr','docker','dfile','multi','dnet','compose','orch','k8sarch','k8scomp','raft','kubectl','pod','deploy','sts','probes','qos','svc','ingress','cfg','jobs','storage']},
 {g:'CI/CD и раннеры',t:'Настройка CI/CD для GitLab-репозитория: схемы и гайд по шагам',u:'https://lred.ru/webmasteru/36074-nastrojka-cicd-dlya-gitlab-repozitoriya-skhemy-i-gajd-po-shagam',n:'в заметках — «GitLab CI/CD — настройка пошагово»',mod:['gitlabci']},
 {g:'CI/CD и раннеры',t:'Reddit r/devops: как подключиться к VPN внутри пайплайна',u:'https://www.reddit.com/r/devops/comments/u2enye/how_to_connect_to_vpn_inside_pipeline/',n:'когда сервер для деплоя доступен только через VPN',mod:['runners','gitlabci']},
 {g:'CI/CD и раннеры',t:'Reddit r/gitlab: GitLab CI — деплой через VPN',u:'https://www.reddit.com/r/gitlab/comments/a6htul/gitlab_ci_how_to_deploy_via_vpn/?tl=ru',n:'та же задача, обсуждение для GitLab',mod:['runners','gitlabci']},
 {g:'CI/CD и раннеры',t:'Self-hosted агенты для Azure Pipelines (Medium)',u:'https://vijayasimhabr.medium.com/configure-self-hosted-agents-for-azure-pipelines-devops-933cb58c795a',n:'свой раннер внутри закрытой сети — альтернатива VPN в пайплайне',mod:['runners']},
 {g:'CI/CD и раннеры',t:'Azure на GitHub (в заметках — «Azure Mission Critical — Private Agents Setup»)',u:'https://github.com/Azure/',n:'ссылка ведёт на всю организацию Azure; нужный репозиторий — поиск «Mission-Critical» внутри',mod:['runners']},
 {g:'CI/CD и раннеры',t:'Видео по теме (из заметок)',u:'https://www.youtube.com/watch?v=Ce-HDCrXMtQ',n:'в заметках стоит рядом с ссылками про раннеры и VPN; тема не проверялась',mod:[]}];
const linksFor=id=>LINKS.filter(l=>l.mod.includes(id));
