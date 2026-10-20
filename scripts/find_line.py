with open(r"c:\Users\patri\Downloads\TPV Mundial\lovable-frontend\src\components\erp\SuppliersModule.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if '{tab === "suppliers"' in l:
        print(f"Line {i+1}: {l.strip()}")
