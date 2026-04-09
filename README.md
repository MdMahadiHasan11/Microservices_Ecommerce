# MIcroservies

# কন্টেইনার স্ট্যাটাস দেখুন

docker ps

# Postgres লগ দেখুন

docker compose logs postgres

# সব বন্ধ করতে

docker compose up
docker compose down

# সব বন্ধ করে ভলিউম মুছে ফেলতে (ডাটা ডিলিট হবে)

docker compose down -v

host.docker.internal

docker container rm redis-stack

npx prisma migrate reset

docker compose -f .\kong-docker-compose.yml up

#konga service
usr: http://host.docker.internal:4003(port)
