.services as $services |
(
  [
    "postgres",
    "redis",
    "minio",
    "minio-init",
    "backend-logs-init",
    "migrate",
    "backend",
    "storefront",
    "crm",
    "media-gateway"
  ]
  | all(. as $name | $services[$name] != null)
) and
(
  [$services[] | has("build")]
  | all(. == false)
) and
(
  ($services.postgres.ports // [] | length == 0) and
  ($services.redis.ports // [] | length == 0) and
  ($services.minio.ports // [] | length == 0) and
  ($services.backend.ports == [{
    "mode": "ingress",
    "target": 8080,
    "published": "8080",
    "host_ip": "127.0.0.1",
    "protocol": "tcp"
  }]) and
  ($services.storefront.ports == [{
    "mode": "ingress",
    "target": 3000,
    "published": "3000",
    "host_ip": "127.0.0.1",
    "protocol": "tcp"
  }]) and
  ($services.crm.ports == [{
    "mode": "ingress",
    "target": 3001,
    "published": "3001",
    "host_ip": "127.0.0.1",
    "protocol": "tcp"
  }]) and
  ($services["media-gateway"].ports == [{
    "mode": "ingress",
    "target": 8080,
    "published": "9002",
    "host_ip": "127.0.0.1",
    "protocol": "tcp"
  }])
) and
(
  (.networks.application.internal == true) and
  (.networks.data.internal == true) and
  ($services.migrate.restart == "no") and
  ($services["minio-init"].restart == "no") and
  ($services["backend-logs-init"].restart == "no") and
  ($services.backend.restart == "unless-stopped") and
  ($services.storefront.restart == "unless-stopped") and
  ($services.crm.restart == "unless-stopped")
) and
(
  ["postgres", "redis", "minio", "backend", "storefront", "crm", "media-gateway"]
  | all(. as $name | ($services[$name].healthcheck.test | length) > 0)
) and
(
  ($services.backend.environment.VYMPEL_DB_URL | contains("postgres:5432")) and
  ($services.backend.environment.VYMPEL_REDIS_URL | contains("redis:6379")) and
  ($services.backend.environment.VYMPEL_S3_ENDPOINT == "http://minio:9000") and
  ($services.storefront.environment.BASE_API_PUBLIC == "http://backend:8080/api/public") and
  ($services.backend.environment.SPRING_LIQUIBASE_ENABLED == "false") and
  ($services.migrate.environment.SPRING_LIQUIBASE_ENABLED == "true") and
  ($services.migrate.environment.VYMPEL_MIGRATION_ONLY == "true")
)
