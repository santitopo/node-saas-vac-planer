# Docker

[Docker](https://es.wikipedia.org/wiki/Docker_(software)) es un proyecto de código abierto que automatiza el despliegue de aplicaciones dentro de contenedores de software, proporcionando una capa adicional de abstracción y automatización de virtualización de aplicaciones en múltiples sistemas operativos

# Docker Compose

Compose es una herramienta para definir y ejecutar aplicaciones Docker en múltiples contenedores. Con Compose se utiliza un archivo para configurar los servicios de la aplicación. Luego, utilizando un solo comando, se creará e iniciará todos los servicios desde su configuración.

# Instalación y ejecución

* Instalar [Docker](https://docs.docker.com/get-docker/), en Linux instalar también [Docker Compose](https://docs.docker.com/compose/install/)
* Iniciar el engine de docker
* Ejecutar en un terminal ```docker-compose up``` en el mismo directorio que el archivo ```docker-compose.yml``` para iniciar todos los servicios

# Bases de datos incluídas

## Redis

* ```docker-compose up redis```
* Acceder al cliente de redis ```docker run -it --network sa-network --rm redis redis-cli -h redis```

## MySQL

* ```docker-compose up mysql```
* Acceder al cliente de mysql ```docker run -it --network sa-network --rm mysql mysql -hmysql -uroot -ppassword```
* Usar Country DB ```use countryDB```. Ejecutar consultas normalmente [query];

## MongoDB

* ```docker-compose up mongo```
* Acceder al cliente de mongodb ```docker run -it --network sa-network --rm mongo mongo --host mongo test```


##Borrar Base de datos entera
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS Slot;
DROP TABLE IF EXISTS State;
DROP TABLE IF EXISTS VacCenter;
DROP TABLE IF EXISTS VaccinationPeriod;
DROP TABLE IF EXISTS Vaccine;
DROP TABLE IF EXISTS Zone;
DROP TABLE IF EXISTS AssignmentCriteria;
SET FOREIGN_KEY_CHECKS = 1;
