# Vac Planner

Scheduling SaaS system to allow for vaccination agenda. The system is meant to allow the creation of neighborhoods, vaccination spots, and assign vaccines to these, expecting an automatic assignation of the slots that take into account different factors like a person's age, time spent waiting, etc. 

Project done using:

- Node.js (APIs)
- Docker container
- SQL (PostgreSQL)
- Redis
- Winston
- Sequelize ORM
- JWT for role-based Auth
- Bull queues
- Winston logger

## Main challenges
💡 High availability and strict security demands are required. Stress tests had to be performed to guarantee availability. </br>
💡 Automatic assignation of the slots that take into account different factors like a person's age, time spent waiting, etc. Modification of this assignation algorithm in runtime without comprising the availability of the system.

## High-level description of the Architecture

Check documentation for more details

<img width="300" alt="image" src="https://github.com/santitopo/node-saas-vac-planer/assets/43559181/6e9d3f75-84e4-4abe-8855-8ed0ff3518f8">

<img width="300" alt="image" src="https://github.com/santitopo/node-saas-vac-planer/assets/43559181/0fd9759c-1b8d-47f5-9675-362992a13e6a">

<img width="300" alt="image" src="https://github.com/santitopo/node-saas-vac-planer/assets/43559181/3f97db49-6c06-414d-b208-998a14f00dba">

<img width="300" alt="image" src="https://github.com/santitopo/node-saas-vac-planer/assets/43559181/f7d74143-f663-49fb-8e90-ec8c88bec698">

<img width="300" alt="image" src="https://github.com/santitopo/node-saas-vac-planer/assets/43559181/70806095-662f-4631-bea6-dbe9ebbbed8f">


Submitted during the course Software Architecture 1
