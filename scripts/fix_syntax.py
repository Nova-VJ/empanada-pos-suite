import re

path = r"c:\Users\patri\Downloads\TPV Mundial\lovable-frontend\src\components\erp\AssistantsModule.tsx"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# Fix broken .join(" \n ");
text = re.sub(r'\.join\("[\r\n]+"\);', r'.join("\\n");', text)

with open(path, "w", encoding="utf-8") as f:
    f.write(text)

print("Fixed syntax")
