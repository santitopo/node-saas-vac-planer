# Vac Planner

Entregado como requisito de la materia Arquitectura de software
Entrega obligatorio

## Inicializacion

0) En caso de ya haber trabajado con el sistema: 

	a) Borrar ambas bases

	b) Correr el comando "flushall" en redis

	c) Asegurarse que Redis este prendido, al igual que Postgres y PGAdmin

1) Correr AdministrationSystem para que se creen las tablas, una vez creadas se puede cerrar
2) Pegar en postgres el script de PERMISOS y ejecutarlo, con este paso crearemos los permisos minimos correspondientes para utilizar la app
3) Ahora ya podemos prender AdministrationSystem, SyncSystem, ReservationSystem y las ExternalApis (deben prenderse ambas, tanto SMS como Registro civil)
4) Logguearse con usuario santitopo pass, copiar el token y correr las requst de Postman que estan en la carpeta "AssignmentCriteria" y tambien correr "Agregar DniCenter" y "Agregar SMSService"
5) Pegar en postgres el script de DATOS y ejecutarlo, alli se crearan algunos datos de prueba
6) El sistema esta listo para usar!