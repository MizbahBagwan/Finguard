from app.database.graph import get_session



# ==============================
# CREATE USER NODE
# ==============================

def create_user(user_id, name):

    with get_session() as graph:

        graph.run(
            """
            MERGE (u:User {id:$id})
            SET u.name=$name
            """,
            id=user_id,
            name=name
        )



# ==============================
# CREATE MERCHANT NODE
# ==============================

def create_merchant(name):

    with get_session() as graph:

        graph.run(
            """
            MERGE (m:Merchant {name:$name})
            """,
            name=name
        )



# ==============================
# CREATE TRANSACTION NODE
# ==============================

def create_transaction(txn_id, amount):

    with get_session() as graph:

        graph.run(
            """
            MERGE (t:Transaction {id:$id})
            SET t.amount=$amount
            """,
            id=txn_id,
            amount=amount
        )



# ==============================
# LINK USER WITH TRANSACTION
# ==============================

def link_transaction(user_id, txn_id):

    with get_session() as graph:

        graph.run(
            """
            MATCH (u:User {id:$uid})
            MATCH (t:Transaction {id:$tid})

            MERGE (u)-[:MADE]->(t)
            """,
            uid=user_id,
            tid=txn_id
        )



# ==============================
# LINK TRANSACTION WITH MERCHANT
# ==============================

def link_merchant(txn_id, merchant):

    with get_session() as graph:

        graph.run(
            """
            MATCH (t:Transaction {id:$tid})
            MATCH (m:Merchant {name:$merchant})

            MERGE (t)-[:AT]->(m)
            """,
            tid=txn_id,
            merchant=merchant
        )



# =================================================
# MAIN FUNCTION
# TRANSACTION GRAPH CREATION
# =================================================

def create_transaction_graph(graph, transaction):

    graph.run(
        """
        MERGE (a:Account {id:$account_id})


        MERGE (t:Transaction {id:$transaction_id})

        SET
            t.amount=$amount,
            t.time=$time,
            t.risk_score=$risk_score,
            t.risk_level=$risk_level,
            t.prediction=$prediction



        MERGE (m:Merchant {name:$merchant})


        MERGE (l:Location {name:$location})



        MERGE (a)-[:MADE]->(t)

        MERGE (t)-[:AT]->(m)

        MERGE (t)-[:FROM]->(l)

        """,

        account_id=getattr(transaction, "account_id", "UNKNOWN"),

        transaction_id=str(transaction.id),

        amount=transaction.amount,

        merchant=transaction.merchant,

        location=transaction.location,

        time=getattr(transaction, "time", ""),

        risk_score=getattr(transaction, "risk_score", 0),

        risk_level=getattr(transaction, "risk_level", "Unknown"),

        prediction=getattr(transaction, "prediction", "Unknown")
    )

# ==========================================
# ANALYZE TRANSACTION GRAPH
# ==========================================

def analyze_transaction_graph(transaction_id):

    with get_session() as graph:

        result = graph.run(
            """
            MATCH (t:Transaction {id:$transaction_id})
            OPTIONAL MATCH (t)-[:AT]->(m:Merchant)
            OPTIONAL MATCH (t)-[:FROM]->(l:Location)
            OPTIONAL MATCH (a:Account)-[:MADE]->(t)

            RETURN
                t,
                a,
                m,
                l
            """,
            transaction_id=str(transaction_id)
        )

        record = result.single()

        if not record:
            return {
                "found": False,
                "message": "Transaction not found in graph"
            }


        return {
            "found": True,
            "account": record["a"],
            "transaction": record["t"],
            "merchant": record["m"],
            "location": record["l"]
        }

      