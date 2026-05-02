import os
import sys
import threading
import subprocess
import webbrowser
import customtkinter as ctk
from tkinter import filedialog, messagebox

# Set appearance mode and default color theme
ctk.set_appearance_mode("Dark")  # Modes: "System" (standard), "Dark", "Light"
ctk.set_default_color_theme("blue")  # Themes: "blue" (standard), "green", "dark-blue"

# List of steps directly scraped from generator.py
ALL_STEPS = [
    "validate", "app", "auth", "middleware", "rbac", "storage", "imap",
    "notifications", "chat", "models", "models_handler", "models_dtos",
    "models_repo", "models_response", "models_controller", "models_graphql",
    "graphql", "grpc", "routes", "api_client", "format"
]

class FiberGeneratorLauncher(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("GoFiber Backend Generator - Custom Control Panel")
        self.geometry("900x750")
        
        # Grid layout 1x2 (left sidebar, right content)
        self.grid_rowconfigure(0, weight=1)
        self.grid_columnconfigure(1, weight=1)
        
        # --- Sidebar ---
        self.sidebar_frame = ctk.CTkFrame(self, width=200, corner_radius=0)
        self.sidebar_frame.grid(row=0, column=0, sticky="nsew")
        self.sidebar_frame.grid_rowconfigure(4, weight=1)

        self.logo_label = ctk.CTkLabel(self.sidebar_frame, text="⚡ GoFiberGen", font=ctk.CTkFont(size=24, weight="bold"))
        self.logo_label.grid(row=0, column=0, padx=20, pady=(20, 10))

        self.btn_open_template = ctk.CTkButton(self.sidebar_frame, text="📄 View Template", command=lambda: self.open_file("configexample/config.yaml"))
        self.btn_open_template.grid(row=1, column=0, padx=20, pady=10)
        
        self.btn_open_prompt = ctk.CTkButton(self.sidebar_frame, text="🤖 View AI Prompt", command=lambda: self.open_file("AI_YML_GENERATOR_PROMPT.md"))
        self.btn_open_prompt.grid(row=2, column=0, padx=20, pady=10)
        
        self.btn_open_master = ctk.CTkButton(self.sidebar_frame, text="⚙️ Master Config", command=lambda: self.open_file("master_config.yaml"))
        self.btn_open_master.grid(row=3, column=0, padx=20, pady=10)

        self.appearance_mode_label = ctk.CTkLabel(self.sidebar_frame, text="Appearance Mode:", anchor="w")
        self.appearance_mode_label.grid(row=5, column=0, padx=20, pady=(10, 0))
        self.appearance_mode_optionemenu = ctk.CTkOptionMenu(self.sidebar_frame, values=["Dark", "Light", "System"], command=self.change_appearance_mode_event)
        self.appearance_mode_optionemenu.grid(row=6, column=0, padx=20, pady=(10, 20))

        # --- Right Content ---
        self.main_frame = ctk.CTkFrame(self, corner_radius=0, fg_color="transparent")
        self.main_frame.grid(row=0, column=1, sticky="nsew", padx=20, pady=20)
        self.main_frame.grid_columnconfigure(0, weight=1)
        self.main_frame.grid_rowconfigure(2, weight=1)

        # 1. Config Picker
        self.config_frame = ctk.CTkFrame(self.main_frame)
        self.config_frame.grid(row=0, column=0, sticky="ew", pady=(0, 20))
        self.config_frame.grid_columnconfigure(1, weight=1)
        
        ctk.CTkLabel(self.config_frame, text="Target Config:", font=ctk.CTkFont(weight="bold")).grid(row=0, column=0, padx=10, pady=10)
        
        self.config_var = ctk.StringVar(value="master_config.yaml")
        self.config_entry = ctk.CTkEntry(self.config_frame, textvariable=self.config_var)
        self.config_entry.grid(row=0, column=1, sticky="ew", padx=(0, 10))
        
        self.btn_browse = ctk.CTkButton(self.config_frame, text="Browse", width=80, command=self.browse_config)
        self.btn_browse.grid(row=0, column=2, padx=(0, 10))

        # Output Folder Picker
        ctk.CTkLabel(self.config_frame, text="Output Directory:", font=ctk.CTkFont(weight="bold")).grid(row=1, column=0, padx=10, pady=(0, 10))
        
        self.output_var = ctk.StringVar(value="./generated")
        self.output_entry = ctk.CTkEntry(self.config_frame, textvariable=self.output_var)
        self.output_entry.grid(row=1, column=1, sticky="ew", padx=(0, 10), pady=(0, 10))
        
        self.btn_browse_out = ctk.CTkButton(self.config_frame, text="Browse", width=80, command=self.browse_output)
        self.btn_browse_out.grid(row=1, column=2, padx=(0, 10), pady=(0, 10))

        # 2. Generator Options (Checkbox Grid)
        self.opts_frame = ctk.CTkScrollableFrame(self.main_frame, label_text="Generator Modules (Uncheck to Skip)", label_font=ctk.CTkFont(weight="bold"), height=200)
        self.opts_frame.grid(row=1, column=0, sticky="ew", pady=(0, 20))
        self.opts_frame.grid_columnconfigure((0, 1, 2, 3), weight=1)
        
        self.strict_var = ctk.BooleanVar(value=False)
        self.chk_strict = ctk.CTkCheckBox(self.opts_frame, text="Strict Validation (Fail on warnings)", variable=self.strict_var, text_color="red")
        self.chk_strict.grid(row=0, column=0, columnspan=2, sticky="w", padx=10, pady=(10, 15))
        
        self.step_vars = {}
        cols = 4
        for i, step in enumerate(ALL_STEPS):
            var = ctk.BooleanVar(value=True) # Default all enabled
            self.step_vars[step] = var
            chk = ctk.CTkCheckBox(self.opts_frame, text=step.replace("_", " ").title(), variable=var)
            chk.grid(row=1 + (i // cols), column=(i % cols), sticky="w", padx=10, pady=5)

        # 3. Execution Console
        self.console_frame = ctk.CTkFrame(self.main_frame)
        self.console_frame.grid(row=2, column=0, sticky="nsew", pady=(0, 20))
        self.console_frame.grid_columnconfigure(0, weight=1)
        self.console_frame.grid_rowconfigure(1, weight=1)
        
        ctk.CTkLabel(self.console_frame, text="Execution Console", font=ctk.CTkFont(weight="bold")).grid(row=0, column=0, sticky="w", padx=10, pady=(10, 0))
        
        self.console = ctk.CTkTextbox(self.console_frame, font=ctk.CTkFont("Consolas", 12), text_color="#2ECC71", state="disabled")
        self.console.grid(row=1, column=0, sticky="nsew", padx=10, pady=10)

        # 4. Run Button
        self.btn_run = ctk.CTkButton(self.main_frame, text="▶ LAUNCH GENERATOR", font=ctk.CTkFont(size=16, weight="bold"), height=50, fg_color="#27AE60", hover_color="#219653", command=self.run_generation)
        self.btn_run.grid(row=3, column=0, sticky="ew")

    def change_appearance_mode_event(self, new_appearance_mode: str):
        ctk.set_appearance_mode(new_appearance_mode)

    def browse_config(self):
        filename = filedialog.askopenfilename(
            title="Select Configuration YAML",
            filetypes=[("YAML Files", "*.yaml *.yml"), ("All Files", "*.*")]
        )
        if filename:
            try:
                rel_path = os.path.relpath(filename, os.getcwd())
                self.config_var.set(rel_path)
            except ValueError:
                self.config_var.set(filename)

    def browse_output(self):
        dirname = filedialog.askdirectory(title="Select Output Directory")
        if dirname:
            try:
                rel_path = os.path.relpath(dirname, os.getcwd())
                self.output_var.set(rel_path)
            except ValueError:
                self.output_var.set(dirname)

    def open_file(self, filepath):
        if not os.path.exists(filepath):
            messagebox.showerror("File Not Found", f"Cannot locate: {filepath}")
            return
        if sys.platform == "win32":
            os.startfile(filepath)
        elif sys.platform == "darwin":
            subprocess.call(["open", filepath])
        else:
            subprocess.call(["xdg-open", filepath])

    def log(self, msg, insert_newline=True):
        self.console.configure(state="normal")
        self.console.insert("end", msg + ("\n" if insert_newline else ""))
        self.console.see("end")
        self.console.configure(state="disabled")

    def run_generation(self):
        config_path = self.config_var.get()
        if not config_path.strip():
            messagebox.showwarning("Missing Config", "Please select a YAML configuration file.")
            return

        cmd = [sys.executable, "generator.py", "--config", config_path]
        
        out_path = self.output_var.get()
        if out_path.strip():
            cmd.extend(["--output", out_path])
            
        if self.strict_var.get():
            cmd.append("--strict")
            
        skipped_steps = [step for step, var in self.step_vars.items() if not var.get()]
        if skipped_steps:
            cmd.append("--skip")
            cmd.extend(skipped_steps)
            
        self.btn_run.configure(state="disabled", text="⏳ RUNNING...", fg_color="#7F8C8D")
        self.console.configure(state="normal")
        self.console.delete("1.0", "end")
        self.console.configure(state="disabled")
        
        self.log(f"⚡ Executing engine: {' '.join(cmd)}\n" + "="*60)

        threading.Thread(target=self._execute_generator, args=(cmd,), daemon=True).start()

    def _execute_generator(self, cmd):
        try:
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1
            )
            for line in iter(process.stdout.readline, ""):
                self.after(0, self.log, line, False)
                
            process.wait()
            
            if process.returncode == 0:
                self.after(0, self.log, "\n✅ Generation Completed Successfully!")
            else:
                self.after(0, self.log, f"\n❌ Generation Failed with Exit Code {process.returncode}")
        except Exception as e:
            self.after(0, self.log, f"\nSystem Error: {str(e)}")
        finally:
            self.after(0, self._enable_run_button)

    def _enable_run_button(self):
        self.btn_run.configure(state="normal", text="▶ LAUNCH GENERATOR", fg_color="#27AE60")

def main():
    app = FiberGeneratorLauncher()
    app.mainloop()

if __name__ == "__main__":
    main()
