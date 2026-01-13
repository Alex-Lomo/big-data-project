from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional, Sequence, Tuple

from databricks import sql


RowDict = Dict[str, Any]


@dataclass(frozen=True)
class DatabricksConfig:
    server_hostname: str        # e.g. "dbc-xxxx.cloud.databricks.com"
    http_path: str              # e.g. "/sql/1.0/warehouses/xxxx"
    access_token: str           # e.g. "dapi...."
    catalog: str = "workspace"
    schema: str = "default"


class DatabricksRepo:
    """
    Minimal repository for reading curated tables from Databricks SQL Warehouse.

    Tables expected (in catalog.schema):
      - sensor_readings_curated
      - crops_data_curated
    """

    def __init__(self, cfg: DatabricksConfig) -> None:
        self.cfg = cfg

    # ---------- public API ----------

    def get_all_crops(self) -> List[RowDict]:
        """
        Returns all rows from crops_data_curated.
        """
        table = self._fqn("crops_data_curated")
        query = f"SELECT * FROM {table} ORDER BY crop_type"
        return self._fetch_all(query)

    def get_latest_sensor_readings_per_device(self) -> List[RowDict]:
        """
        Returns 1 latest reading per device_id from sensor_readings_curated.
        """
        table = self._fqn("sensor_readings_curated")
        query = f"""
        WITH ranked AS (
          SELECT
            *,
            ROW_NUMBER() OVER (
              PARTITION BY device_id
              ORDER BY event_time DESC, ingestion_time DESC
            ) AS rn
          FROM {table}
        )
        SELECT
          event_time,
          device_id,
          temperature,
          humidity,
          rainfall,
          nitrogen,
          potassium,
          phosphorous,
          source,
          ingestion_time
        FROM ranked
        WHERE rn = 1
        ORDER BY device_id
        """
        return self._fetch_all(query)

    def get_sensor_history(
        self,
        from_ts: datetime,
        to_ts: datetime,
        device_id: Optional[str] = None,
        limit: int = 1000,
        order: str = "desc",
    ) -> List[RowDict]:
        """
        Returns sensor readings in [from_ts, to_ts), optionally filtered by device_id.
        Designed for batch/history endpoints.

        - from_ts, to_ts: Python datetimes (timezone-aware recommended)
        - device_id: optional "sensor-001"
        - limit: safety cap
        - order: "desc" or "asc" by event_time
        """
        if limit <= 0 or limit > 50_000:
            raise ValueError("limit must be between 1 and 50000")

        order_sql = "DESC" if order.lower() == "desc" else "ASC"
        table = self._fqn("sensor_readings_curated")

        # databricks-sql-connector uses qmark paramstyle: "?"
        query = f"""
        SELECT
          event_time,
          device_id,
          temperature,
          humidity,
          rainfall,
          nitrogen,
          potassium,
          phosphorous,
          source,
          ingestion_time
        FROM {table}
        WHERE event_time >= ?
          AND event_time <  ?
          AND (? IS NULL OR device_id = ?)
        ORDER BY event_time {order_sql}
        LIMIT ?
        """

        params: Tuple[Any, ...] = (from_ts, to_ts, device_id, device_id, limit)
        return self._fetch_all(query, params=params)

    # ---------- internals ----------

    def _fqn(self, table: str) -> str:
        # Fully qualified name: catalog.schema.table
        return f"{self.cfg.catalog}.{self.cfg.schema}.{table}"

    def _connect(self):
        return sql.connect(
            server_hostname=self.cfg.server_hostname,
            http_path=self.cfg.http_path,
            access_token=self.cfg.access_token,
        )

    def _fetch_all(self, query: str, params: Optional[Sequence[Any]] = None) -> List[RowDict]:
        """
        Executes a query and returns a list[dict] (JSON-friendly).
        """
        with self._connect() as conn:
            with conn.cursor() as cur:
                if params is None:
                    cur.execute(query)
                else:
                    cur.execute(query, params)

                rows = cur.fetchall()
                colnames = [d[0] for d in cur.description] if cur.description else []
                return [dict(zip(colnames, row)) for row in rows]
