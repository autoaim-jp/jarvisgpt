SHELL=/bin/bash
PHONY=default app-up app-rebuild app-down help

.PHONY: $(PHONY)

default: app-up

app-up: docker-compose-up-app
app-rebuild: app-down app-up
app-down: docker-compose-down

yarn-add: docker-restart-install-stop

help:
	@echo "Usage: "
	@echo "	make app-up	exec app with docker compose"
	@echo "	make app-rebuild	stop container then rebuild Dockerfile"
	@echo "	make app-down	stop app"
	@echo "	make yarn-add container= package=	add node_modules package"
	@echo "	make help	show help"


docker-compose-up-app:
	docker compose -p jarvisgpt-app -f ./app/docker/docker-compose.app.yml up

docker-compose-down-app:
	docker compose -p jarvisgpt-app -f ./app/docker/docker-compose.app.yml down --volumes

docker-restart-install-stop:
	docker restart jarvisgpt-app-$(container)
	docker exec -it jarvisgpt-app-$(container) /bin/bash -c "yarn add $(package)"
	docker stop jarvisgpt-app-$(container)

%:
	@echo "target '$@' not found"
	@make -s help

