SHELL=/bin/bash
PHONY=default app-up-openjtalk app-up-voicepeak app-rebuild app-down app-build yarn-add help

.PHONY: $(PHONY)

default: app-up-openjtalk

app-up-openjtalk: start-recorder start-player docker-compose-up-app-openjtalk
app-up-voicepeak: start-recorder start-voicepeak-container start-player docker-compose-up-app-voicepeak
app-rebuild: app-down app-build
app-down: docker-compose-down-app
app-build: docker-compose-build-app

yarn-add: docker-restart-install-stop

help:
	@echo "Usage: "
	@echo "	make app-up-openjtalk	exec app with docker compose, openjtalk"
	@echo "	make app-up-voicepeak	exec app with docker compose, voicepeak"
	@echo "	make app-rebuild	stop container then rebuild Dockerfile"
	@echo "	make app-down	stop app"
	@echo "	make app-build	build app image"
	@echo "	make yarn-add container= package=	add node_modules package"
	@echo "	make help	show help"


start-recorder:
	cd service/vosk/src/ && pip3 install -r requirements.txt && python3 app.py &

start-voicepeak-container:
	cd service/voicepeak/src/ && yarn install && SPEAK_CONTAINER=jarvisgpt-voicepeak yarn start-watch &

start-player:
	cd app/player/bin/ && ./fetchAndPlay.sh &

docker-compose-up-app-openjtalk:
	SPEAK_CONTAINER=jarvisgpt-openjtalk docker compose -p jarvisgpt-app -f ./app/docker/docker-compose.app.yml up

docker-compose-up-app-openjtalk-backup20240313:
	pulseaudio --kill
	rm -rf service/vosk/src/data/pulseaudio.socket
	rm -rf service/vosk/src/data/pulseaudio.client.conf && touch service/vosk/src/data/pulseaudio.client.conf
	pacmd load-module module-native-protocol-unix socket=./service/vosk/src/data/pulseaudio.socket
	pulseaudio --check -v 
	SPEAK_CONTAINER=jarvisgpt-openjtalk docker compose -p jarvisgpt-app -f ./app/docker/docker-compose.app.yml up
	pulseaudio --kill

docker-compose-up-app-voicepeak:
	SPEAK_CONTAINER=jarvisgpt-voicepeak docker compose -p jarvisgpt-app -f ./app/docker/docker-compose.app.yml up

docker-compose-build-app:
	docker compose -p jarvisgpt-app -f ./app/docker/docker-compose.app.yml build

docker-compose-down-app:
	docker compose -p jarvisgpt-app -f ./app/docker/docker-compose.app.yml down --volumes

docker-restart-install-stop:
	docker restart jarvisgpt-app-$(container)
	docker exec -it jarvisgpt-app-$(container) /bin/bash -c "yarn add $(package)"
	docker stop jarvisgpt-app-$(container)

%:
	@echo "target '$@' not found"
	@make -s help

