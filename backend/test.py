from databricks import sql
import os, socket, ssl
from dotenv import load_dotenv
from databricks_repo import DatabricksConfig, DatabricksRepo
from datetime import datetime, timedelta, timezone

load_dotenv()

host = os.getenv("DATABRICKS_SERVER_HOSTNAME")
path = os.getenv("DATABRICKS_HTTP_PATH")
token = os.getenv("DATABRICKS_TOKEN")

assert host, "Missing DATABRICKS_SERVER_HOSTNAME"
assert path, "Missing DATABRICKS_HTTP_PATH"
assert token, "Missing DATABRICKS_TOKEN"

cfg = DatabricksConfig(
    server_hostname=host,
    http_path=path,
    access_token=token,
    catalog="workspace",
    schema="default"
)

repo = DatabricksRepo(cfg)

# Crops
crops = repo.get_all_crops()

# Latest sensor data
latest = repo.get_latest_sensor_readings_per_device()

# History (last 24h, all sensors)
now = datetime.now(timezone.utc)
history = repo.get_sensor_history(
    from_ts=now - timedelta(hours=24),
    to_ts=now,
    limit=10,
    order="desc"
)