#!/usr/bin/env python3
"""
scripts/execute_notebook.py
Executes notebooks/minor_project_progress.ipynb using nbclient and saves
all execution outputs (DataFrames, SQL results, logs, and plots) into the notebook JSON.
Also copies the executed notebook to the project root.
"""

import os
import shutil
import nbformat
from nbclient import NotebookClient

def main():
    notebook_path = "notebooks/minor_project_progress.ipynb"
    print(f"Reading {notebook_path}...")
    with open(notebook_path, "r", encoding="utf-8") as f:
        nb = nbformat.read(f, as_version=4)

    client = NotebookClient(nb, timeout=600, kernel_name="python3")
    print("Executing notebook with nbclient (this runs all 5 steps in PySpark)...")
    client.execute()
    print("Execution finished successfully!")

    with open(notebook_path, "w", encoding="utf-8") as f:
        nbformat.write(nb, f)
    print(f"Saved populated notebook to {notebook_path}")

    # Copy to repo root for instant visibility
    root_path = "minor_project_progress.ipynb"
    shutil.copyfile(notebook_path, root_path)
    print(f"Copied populated notebook to {root_path}")

if __name__ == "__main__":
    main()
