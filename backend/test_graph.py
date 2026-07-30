from app.services.graph_service import FraudGraph

graph = FraudGraph()

graph.add_transaction("ACC1001", "ACC2001", 5000)
graph.add_transaction("ACC1001", "ACC3001", 12000)

print(graph.get_connections("ACC1001"))