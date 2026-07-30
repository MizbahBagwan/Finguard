import networkx as nx


class FraudGraph:

    def __init__(self):
        self.graph = nx.Graph()

    def add_transaction(self, sender, receiver, amount):
        self.graph.add_node(sender, type="Account")
        self.graph.add_node(receiver, type="Account")
        self.graph.add_edge(sender, receiver, amount=amount)

    def get_connections(self, account):
        if account in self.graph:
            return list(self.graph.neighbors(account))
        return []

    def get_graph(self):
        return self.graph


# Function used by /investigate endpoint
def analyze_transaction_graph(account_id):

    return {
        "related_accounts": [
            "ACC2001",
            "ACC3001"
        ],
        "risk_connections": 2,
        "account_checked": account_id
    }