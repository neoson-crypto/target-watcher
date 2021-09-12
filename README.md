## Requirements
- docker

## Usage

#### First time installation
- download or clone this repo
- run the following script (take some time)
```bash
docker run -v $(pwd):/var/www/html:delegated target-watcher/target-watcher:latest npm install
```
- update `.env` file
```bash
mv .env.example .env
```

#### Start
```bash
docker-compose up -d
```

#### Stop
```bash
docker-compose down
```