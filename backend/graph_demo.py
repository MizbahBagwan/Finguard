from app.services.graph_service import *

create_user(1, "Mizba")

create_merchant("Amazon")

create_transaction("TXN001", 25000)

link_transaction(1, "TXN001")

link_merchant("TXN001", "Amazon")

print("Knowledge Graph Created Successfully!")