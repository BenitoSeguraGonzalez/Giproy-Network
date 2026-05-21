import os

DIR="docs/tasks"

nums=[]
for f in os.listdir(DIR):
 if f.startswith("TASK-"):
  nums.append(int(f.split("-")[1].split(".")[0]))

n=max(nums)+1 if nums else 1
name=f"TASK-{str(n).zfill(4)}.md"

with open(os.path.join(DIR,name),"w") as f:
 f.write("# "+name)

print("TASK creada:",name)
