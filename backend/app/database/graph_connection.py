from backend.app.database.graph import get_session


def test_connection():
    with get_session() as session:
        result = session.run(
            "RETURN 'Neo4j Connected' AS msg"
        )
        print(result.single()["msg"])


if __name__ == "__main__":
    test_connection()