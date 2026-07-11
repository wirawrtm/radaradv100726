import re

with open("server.ts", "r") as f:
    content = f.read()

target = """async function handleUpdatePartner(body: any) {
  const data = await getSheetValues("channel");"""

replacement = """async function handleUpdatePartner(body: any) {
  console.log("handleUpdatePartner body:", body);
  const data = await getSheetValues("channel");"""

content = content.replace(target, replacement)
with open("server.ts", "w") as f:
    f.write(content)
print("Added log to handleUpdatePartner")
