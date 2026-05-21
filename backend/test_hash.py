import bcrypt
h = "$2b$12$FMXHl9cOwQACm6ZAjbkIAe9qcMAemwB5STZNhaEiKykPd0kxAiA7C"
p = "Cocoliso.1"
print(f"MATCH: {bcrypt.checkpw(p.encode(), h.encode())}")
