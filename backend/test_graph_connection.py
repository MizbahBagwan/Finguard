from app.database.graph import get_session

with get_session() as session:
    result = session.run(
        "RETURN 'Neo4j Connected Successfully' AS msg"
    )

    print(result.single()["msg"])