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

💡 High availability and strict security demands are required. Stress tests had to be performed to guarantee availability.
💡 Automatic assignation of the slots that take into account different factors like a person's age, time spent waiting, etc. Modification of this assignation algorithm in runtime without comprising the availability of the system.

Submitted during the course Software Architecture 1
