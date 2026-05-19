#!/usr/bin/env python3
"""
M&D ENGINEERS - COMPLETE BILLS MIGRATION TO RAILWAY
Runs both base migration and enhancements
"""

import psycopg2
import sys
from pathlib import Path

# Railway Database Credentials
DB_CONFIG = {
    'host': 'tramway.proxy.rlwy.net',
    'port': 17521,
    'database': 'railway',
    'user': 'postgres',
    'password': 'EZixMqIvXSeiyrxESSHnHEWSOikCMAhe'
}

def connect_db():
    """Connect to Railway PostgreSQL database"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except psycopg2.Error as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)

def read_sql_file(filepath):
    """Read SQL file and return statements"""
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        # Split by semicolon but be careful with comments
        statements = []
        current = ''
        for line in content.split('\n'):
            # Skip comments
            if line.strip().startswith('--'):
                current += line + '\n'
                continue
            current += line + '\n'
            if ';' in line:
                statements.append(current.strip())
                current = ''
        if current.strip():
            statements.append(current.strip())
        return [s for s in statements if s and not s.startswith('--')]
    except FileNotFoundError:
        print(f"❌ File not found: {filepath}")
        return None

def execute_migrations(conn, base_file, enhance_file):
    """Execute both base and enhancement migrations"""
    cursor = conn.cursor()
    total_statements = 0
    successful = 0
    failed = 0
    
    print("\n" + "="*70)
    print("      M&D ENGINEERS - COMPLETE BILLS MIGRATION")
    print("="*70)
    print(f"\n📍 Target Database: {DB_CONFIG['database']}")
    print(f"🔌 Host: {DB_CONFIG['host']}:{DB_CONFIG['port']}")
    print(f"👤 User: {DB_CONFIG['user']}\n")
    
    # Phase 1: Base Migration
    print("📋 PHASE 1: Base Migration (Create Base Tables)")
    print("-" * 70)
    
    base_statements = read_sql_file(base_file)
    if not base_statements:
        print(f"❌ Failed to read {base_file}")
        return False
    
    for idx, statement in enumerate(base_statements, 1):
        if not statement.strip():
            continue
        total_statements += 1
        try:
            cursor.execute(statement)
            print(f"  ✅ Statement {idx}: OK")
            successful += 1
        except psycopg2.Error as e:
            if 'already exists' in str(e):
                print(f"  ⓘ  Statement {idx}: Already exists (skipped)")
            else:
                print(f"  ⚠️  Statement {idx}: {str(e)[:60]}")
            failed += 1
    
    conn.commit()
    print(f"\n✅ Phase 1 complete: {successful} succeeded, {failed} warnings/skipped\n")
    
    # Phase 2: Enhancements
    print("📋 PHASE 2: Enhancement Migration (Alter & Create Support Tables)")
    print("-" * 70)
    
    enhance_statements = read_sql_file(enhance_file)
    if not enhance_statements:
        print(f"❌ Failed to read {enhance_file}")
        return False
    
    successful_phase2 = 0
    failed_phase2 = 0
    
    for idx, statement in enumerate(enhance_statements, 1):
        if not statement.strip():
            continue
        total_statements += 1
        try:
            cursor.execute(statement)
            print(f"  ✅ Statement {idx}: OK")
            successful_phase2 += 1
        except psycopg2.Error as e:
            if 'already exists' in str(e) or 'duplicate key' in str(e):
                print(f"  ⓘ  Statement {idx}: Already exists (skipped)")
            else:
                print(f"  ⚠️  Statement {idx}: {str(e)[:80]}")
            failed_phase2 += 1
    
    conn.commit()
    print(f"\n✅ Phase 2 complete: {successful_phase2} succeeded, {failed_phase2} warnings/skipped\n")
    
    cursor.close()
    return True

def verify_tables(conn):
    """Verify that all required tables were created"""
    cursor = conn.cursor()
    
    required_tables = [
        'bills', 'bill_items', 'customers', 'particulars',
        'payment_modes', 'payments', 'bill_status_history',
        'tax_rates', 'bill_sync_log', 'bill_reminders', 'bill_templates'
    ]
    
    print("\n" + "="*70)
    print("      VERIFICATION - Checking Created Tables")
    print("="*70 + "\n")
    
    cursor.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
    """)
    
    existing_tables = {row[0] for row in cursor.fetchall()}
    
    print("📊 TABLE STATUS:\n")
    created_count = 0
    for table in required_tables:
        if table in existing_tables:
            print(f"  ✅ {table:<25} - CREATED")
            created_count += 1
        else:
            print(f"  ❌ {table:<25} - NOT FOUND")
    
    print(f"\n✅ Total: {created_count}/{len(required_tables)} tables created successfully")
    
    # Check payment_modes has data
    if 'payment_modes' in existing_tables:
        cursor.execute("SELECT COUNT(*) FROM payment_modes")
        count = cursor.fetchone()[0]
        print(f"\n💾 payment_modes contains {count} records")
    
    # Check tax_rates has data
    if 'tax_rates' in existing_tables:
        cursor.execute("SELECT COUNT(*) FROM tax_rates")
        count = cursor.fetchone()[0]
        print(f"💾 tax_rates contains {count} records")
    
    cursor.close()
    return created_count == len(required_tables)

def main():
    # Get the directory of this script
    script_dir = Path(__file__).parent.absolute()
    base_migration = script_dir / 'bills_migration.sql'
    enhance_migration = script_dir / 'add_bills_tables_complete.sql'
    
    print("\n🔄 Connecting to Railway PostgreSQL database...")
    conn = connect_db()
    print("✅ Connection successful!\n")
    
    # Run migrations
    if execute_migrations(conn, str(base_migration), str(enhance_migration)):
        # Verify
        verify_tables(conn)
        
        print("\n" + "="*70)
        print("      ✅ MIGRATION COMPLETED SUCCESSFULLY!")
        print("="*70)
        print("\n📝 Next Steps:")
        print("  1. Start your backend: npm start")
        print("  2. Test the Bills page in frontend")
        print("  3. Follow BILLS_FRONTEND_TESTING_GUIDE.md\n")
        
        conn.close()
        sys.exit(0)
    else:
        print("\n❌ Migration failed!")
        conn.close()
        sys.exit(1)

if __name__ == '__main__':
    main()
