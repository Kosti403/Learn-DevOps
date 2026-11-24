# ROADMAP — DevOps с нуля до junior + собес

Цель: понимать, **что происходит в системе и почему**, а не помнить команды. Каждая тема: механизм → команды → лаба руками (без ИИ) → вопросы собеса.
Источник порядка — `src/course/order.js`. Обзор — каждый 8-й модуль. Порог открытия — 60%.
Опора: boostmentor ultimate-devops-guide, видео «Kubernetes с нуля» (таймкоды ниже у модулей K8s), личные заметки (вопросы «нажми и ответь себе»).

Статус: ✅ готов · 🛠 в работе · ⬜ не начат

## Сквозной проект «Магазин» (`src/course/project.js`, экран #project)
Node.js CRUD API + **MS SQL Server** (Oracle — легаси-тикет 1.5) → голый сервер в WSL (systemd, nginx, ssh, ufw; VPS по желанию, тикет 0.10) → Docker/Compose → Kubernetes → Helm → GitLab CI/CD (+Vault) → Prometheus/Grafana → Terraform → README, инцидент, рассказ, резюме. 8 спринтов, 37 тикетов, у каждого: зачем · что сделать · готово, когда · какие модули готовят.
- **Курс первичен, проект подстраивается под курс.** Модули пишутся по своей логике (темы, порядок, ситуации — любые жизненные). Проект — практика по уже пройденному: тикет открывается, когда пройдены его модули (`need`). Изменился состав или порядок модулей — правим тикеты, а не модули.
- После модуля, который закрывает подготовку тикета, в модуле появляется блок «🛠 В проекте» (сам, по `need`).
- **Разбор инцидента** в конце каждого уровня (inc1, inc2, incident, inc4): длинная задача без вариантов — дан вывод нескольких команд, найти причину самому, записать «симптом → диагностика → причина → исправление».

## Уровень 1 · Linux-база (Л1) — только своя тема
| № | id | Тема | Статус |
|---|---|---|---|
| 1 | linux | Что такое Linux: ядро, дистрибутивы, Ubuntu и LTS, почему Ubuntu на проде | ✅ |
| 2 | shell | Терминал: bash/sh/zsh, пути, навигация, man/--help, `.sh` vs `.ps1` | ✅ |
| 3 | files | Файлы и иерархия ФС: /etc /var /opt /home, cat/less/tail/find | ✅ |
| 4 | perms | Пользователи и права: rwx, 755, chown, sudo | ✅ |
| 5 | streams | Потоки: stdout/stderr, > >> 2>&1, пайпы | ✅ |
| 6 | text | Текст: grep, sed, awk, cut, sort, uniq, wc | ✅ |
| 7 | procs | Процессы и сигналы: ps, kill, SIGTERM/SIGKILL, фон, nohup | ✅ |
| 8 | r1 | **Обзор 1** (1–7) | ✅ |
| 9 | res | «Сервер тормозит»: load average, top, free, vmstat, iostat, df/du → кто → почему (strace, lsof, логи) | ✅ |
| 10 | systemd | systemd, unit-файлы, journalctl | ✅ |
| 11 | pkgs | Пакеты: apt, репозитории, версии | ✅ |
| 12 | bash1 | Bash-скрипты 1: shebang, переменные, кавычки, $?, if, for, set -euo pipefail | ✅ |
| 13 | bash2 | Bash-скрипты 2: функции, $1 $@, trap, cron | ✅ |
| 14 | pwsh | PowerShell (.ps1) для DevOps: объекты вместо текста, соответствия bash | ✅ |
| 15 | net1 | Сеть: IP, маска, порты, TCP/UDP, ss, curl, ping | ⬜ |
| 16 | r2 | **Обзор 2** (1–15) | ⬜ |
| 17 | dns | DNS и HTTP: dig, /etc/hosts, коды, заголовки | ⬜ |
| 18 | ssh | SSH: рукопожатие, ключи хоста и пользователя, ed25519/rsa/ecdsa, known_hosts, agent, config | ⬜ |
| 19 | fw | Firewall: ufw, iptables | ⬜ |
| 20 | nginx | Nginx: reverse proxy, upstream, A/B-слоты, nginx -t | ⬜ |
| 21 | git | Git для DevOps | ⬜ |
| 22 | inc1 | **Разбор инцидента 1**: магазин на голом сервере не отвечает (диск, права, сервис, nginx) | ⬜ |

## Уровень 2 · Контейнеры (Л2) — с модуля 29 лёгкое смешивание, с 33 усложнено
| id | Тема | Видео |
|---|---|---|
| ctr | Контейнер vs VM: namespaces и cgroups | 15:08, 1:04:38 |
| docker | docker run / exec / ps / logs | 17:10 |
| dfile | Dockerfile и слои, кэш, порядок команд | 22:45, 43:24 |
| multi | Multistage: 309 МБ → 15 МБ, Alpine vs distroless | 30:41, 1:23:15 |
| r3 | **Обзор 3** | |
| vol | Volumes и bind mounts | |
| dnet | Сеть контейнера: veth, bridge, маршруты, путь пакета | 1:12:28, 1:39:48 |
| compose | Docker Compose, DNS 127.0.0.11, healthcheck, depends_on | 1:30:25 |
| registry | Registry, теги, save/load | |
| orch | Compose / Swarm / Kubernetes — когда что | 7:42, 13:40 |
| inc2 | **Разбор инцидента 2**: контейнеры магазина (не видят базу, кончилось место, OOM) | |

## Уровень 3 · Kubernetes (Л3)
k8sarch (control plane/worker, 1:55) · k8scomp (api-server, etcd, scheduler, controller-manager, 1:59) · raft (кворум, 2:22) · kubectl (kubeconfig, контекст, RBAC, 2:17) · pod (sidecar, сеть пода, CNI, 2:33–2:58) · deploy (rolling update, drain, PDB, 2:58–3:15) · sts (StatefulSet, DaemonSet, 3:15) · probes (3:23) · qos (requests/limits, 3:28) · svc (Service, kube-proxy, DNS, 3:33) · ingress (4:02) · cfg (ConfigMap/Secret, base64 ≠ шифрование, 4:12–4:37) · jobs (Job/CronJob/CRD/Namespace, 4:41) · storage (PV/PVC/StorageClass, 4:46) · helm · incident (разбор поломки: selector 4:08, Pending, CrashLoop)

## Уровень 4 · Доставка и инфраструктура (Л4) — около половины смешанных
gitlabci · runners · vault · tf1 (IaC, provider, plan/apply) · tfstate (state, remote backend, S3: versioning, запрет удаления, откат версии, lock) · tfmod (variables, workspaces, modules, Terragrunt) · prom (Prometheus, метрики) · grafana (RPS, p95, error rate, алерты) · bluegreen (деплой-стратегии) · sql (MS SQL / T-SQL: sqlcmd, SSMS/dbForge, логины и роли, бэкап и восстановление, лицензии Developer/Express; основы Oracle: sqlplus, схемы, DBeaver) · **inc4** (разбор инцидента: пайплайн, state, алерты)

## Уровень 5 · Собес
Сценарии «прод упал», вопросы по всем темам, разбор «почему».

## План по неделям (7 недель)
1 Linux → 2 Docker → 3 K8s → 4 Helm → 5 CI/CD → 6 Terraform → 7 Собес
