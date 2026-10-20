import os
import shutil
import subprocess

def run_command(command):
    print(f"👉 Running: {command}")
    result = subprocess.run(command, shell=True)
    if result.returncode != 0:
        print(f"❌ Error while running: {command}")
    else:
        print("✅ Done.")

def remove_path(path):
    if os.path.exists(path):
        if os.path.isdir(path):
            shutil.rmtree(path)
            print(f"🗑️ Removed folder: {path}")
        else:
            os.remove(path)
            print(f"🗑️ Removed file: {path}")
    else:
        print(f"⚠️ Not found, skip: {path}")

def main():
    print("=== 🚀 React Project Cache Cleaner (Only Cache) ===")

    # 1. ล้าง npm cache global
    run_command("npm cache clean --force")

    # 2. ลบ cache ของ React (Webpack/Babel)
    remove_path("node_modules/.cache")

    # 3. ลบ build เก่า (ถ้าอยากเก็บไว้ ก็ตัดบรรทัดนี้ออกได้)
    remove_path("build")

    print("✨ Finished! Cache has been cleared.")

if __name__ == "__main__":
    main()
