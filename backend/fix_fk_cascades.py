import asyncio
from sqlalchemy import text
from core.database import engine

async def update_foreign_keys():
    async with engine.begin() as conn:
        print("Updating foreign key constraints for cascading deletes...")
        
        # List of (table, column, target_table, on_delete)
        # We need to find the constraint names first or just drop and recreate
        
        constraints_to_fix = [
            ("license_keys", "app_id", "applications", "CASCADE"),
            ("end_users", "app_id", "applications", "CASCADE"),
            ("sessions", "user_id", "end_users", "CASCADE"),
            ("sessions", "app_id", "applications", "CASCADE"),
            ("activity_logs", "app_id", "applications", "CASCADE"),
            ("activity_logs", "user_id", "end_users", "CASCADE"),
            ("blacklist", "app_id", "applications", "CASCADE"),
            ("variables", "app_id", "applications", "CASCADE"),
            ("webhooks_log", "app_id", "applications", "CASCADE"),
            ("webhooks_log", "endpoint_id", "webhook_endpoints", "CASCADE"),
            ("webhook_endpoints", "app_id", "applications", "CASCADE"),
        ]
        
        for table, col, target, action in constraints_to_fix:
            try:
                # Find the constraint name (PostgreSQL specific)
                result = await conn.execute(text(f"""
                    SELECT constraint_name 
                    FROM information_schema.key_column_usage 
                    WHERE table_name = '{table}' AND column_name = '{col}'
                    AND table_schema = 'public'
                """))
                row = result.fetchone()
                if row:
                    constraint_name = row[0]
                    print(f"Fixing {table}.{col} (dropping {constraint_name})")
                    await conn.execute(text(f"ALTER TABLE {table} DROP CONSTRAINT {constraint_name}"))
                    await conn.execute(text(f"ALTER TABLE {table} ADD CONSTRAINT {constraint_name} FOREIGN KEY ({col}) REFERENCES {target}(id) ON DELETE {action}"))
                else:
                    print(f"Could not find constraint for {table}.{col}")
            except Exception as e:
                print(f"Error updating {table}.{col}: {e}")

        # Also handle end_users.license_key_id separately (SET NULL)
        try:
            result = await conn.execute(text("""
                SELECT constraint_name 
                FROM information_schema.key_column_usage 
                WHERE table_name = 'end_users' AND column_name = 'license_key_id'
                AND table_schema = 'public'
            """))
            row = result.fetchone()
            if row:
                constraint_name = row[0]
                print(f"Fixing end_users.license_key_id (dropping {constraint_name})")
                await conn.execute(text(f"ALTER TABLE end_users DROP CONSTRAINT {constraint_name}"))
                await conn.execute(text(f"ALTER TABLE end_users ADD CONSTRAINT {constraint_name} FOREIGN KEY (license_key_id) REFERENCES license_keys(id) ON DELETE SET NULL"))
        except Exception as e:
            print(f"Error updating end_users.license_key_id: {e}")

        print("Done!")

if __name__ == "__main__":
    asyncio.run(update_foreign_keys())
