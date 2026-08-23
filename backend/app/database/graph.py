from neo4j import GraphDatabase

URI = "bolt://localhost:7687"
USERNAME = "neo4j"
PASSWORD = "Finguard@123"
DATABASE = "neo4j"

driver = GraphDatabase.driver(
    URI,
    auth=(USERNAME, PASSWORD)
)


def get_session():
    return driver.session(database=DATABASE)


def close_driver():
    driver.close()