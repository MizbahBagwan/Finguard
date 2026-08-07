from app.database.graph import get_session

with get_session() as session:

    session.run("""
    CREATE (u:User {
        id: 1,
        name: 'Demo User'
    })
    """)

print("User node created successfully!")