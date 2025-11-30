import JSZip from 'jszip';

export const generateProjectZip = async () => {
  const zip = new JSZip();

  // ==========================================
  // 1. BACKEND - SPRING BOOT
  // ==========================================
  const backend = zip.folder("backend-springboot");

  // pom.xml
  backend?.file("pom.xml", `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>
	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-parent</artifactId>
		<version>3.2.0</version>
		<relativePath/>
	</parent>
	<groupId>com.devmemory</groupId>
	<artifactId>api</artifactId>
	<version>0.0.1-SNAPSHOT</version>
	<name>devmemory-api</name>
	<description>Backend for DevMemory</description>

	<properties>
		<java.version>17</java.version>
	</properties>

	<dependencies>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-data-jpa</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-web</artifactId>
		</dependency>
		<dependency>
			<groupId>com.mysql</groupId>
			<artifactId>mysql-connector-j</artifactId>
			<scope>runtime</scope>
		</dependency>
		<dependency>
			<groupId>org.projectlombok</groupId>
			<artifactId>lombok</artifactId>
			<optional>true</optional>
		</dependency>
	</dependencies>

	<build>
		<plugins>
			<plugin>
				<groupId>org.springframework.boot</groupId>
				<artifactId>spring-boot-maven-plugin</artifactId>
				<configuration>
					<excludes>
						<exclude>
							<groupId>org.projectlombok</groupId>
							<artifactId>lombok</artifactId>
						</exclude>
					</excludes>
				</configuration>
			</plugin>
		</plugins>
	</build>
</project>`);

  // Application Properties
  backend?.file("src/main/resources/application.properties", `
spring.datasource.url=jdbc:mysql://localhost:3306/devmemory?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
server.port=8080
`);

  // Java Files Structure
  const javaBase = backend?.folder("src/main/java/com/devmemory/api");
  
  // Main Class
  javaBase?.file("DevMemoryApplication.java", `package com.devmemory.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DevMemoryApplication {
	public static void main(String[] args) {
		SpringApplication.run(DevMemoryApplication.class, args);
	}
}`);

  // Model
  javaBase?.file("model/Note.java", `package com.devmemory.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Note {
    @Id
    private String id;
    
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String content;
    
    @Enumerated(EnumType.STRING)
    private NoteType type;
    
    @ElementCollection
    private List<String> tags;
    
    private Long createdAt;
    private Long lastModified;

    public enum NoteType { COMMAND, SNIPPET, PROCEDURE, LINK, CONFIG, ERROR_FIX }
}`);

  // Repository
  javaBase?.file("repository/NoteRepository.java", `package com.devmemory.api.repository;

import com.devmemory.api.model.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NoteRepository extends JpaRepository<Note, String> {
}`);

  // Controller
  javaBase?.file("controller/NoteController.java", `package com.devmemory.api.controller;

import com.devmemory.api.model.Note;
import com.devmemory.api.repository.NoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notes")
@CrossOrigin(origins = "http://localhost:4200") // Angular default port
public class NoteController {

    @Autowired
    private NoteRepository repository;

    @GetMapping
    public List<Note> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public Note create(@RequestBody Note note) {
        if (note.getId() == null || note.getId().isEmpty()) {
            note.setId(UUID.randomUUID().toString());
        }
        long now = System.currentTimeMillis();
        note.setCreatedAt(now);
        note.setLastModified(now);
        return repository.save(note);
    }

    @PutMapping("/{id}")
    public Note update(@PathVariable String id, @RequestBody Note note) {
        note.setLastModified(System.currentTimeMillis());
        return repository.save(note);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        repository.deleteById(id);
    }
}`);

  // ==========================================
  // 2. FRONTEND - ANGULAR
  // ==========================================
  const frontend = zip.folder("frontend-angular");

  // package.json
  frontend?.file("package.json", `{
  "name": "devmemory-web",
  "version": "0.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "^16.0.0",
    "@angular/common": "^16.0.0",
    "@angular/compiler": "^16.0.0",
    "@angular/core": "^16.0.0",
    "@angular/forms": "^16.0.0",
    "@angular/platform-browser": "^16.0.0",
    "@angular/platform-browser-dynamic": "^16.0.0",
    "@angular/router": "^16.0.0",
    "@google/genai": "^1.30.0",
    "lucide-angular": "^0.255.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.13.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^16.0.0",
    "@angular/cli": "~16.0.0",
    "@angular/compiler-cli": "^16.0.0",
    "@types/node": "^16.0.0",
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "typescript": "~5.0.0"
  }
}`);

  // tailwind.config.js
  frontend?.file("tailwind.config.js", `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        java: { 500: '#E76F00', 600: '#C55A00' },
        dark: { 900: '#0f172a', 800: '#1e293b', 700: '#334155' }
      },
      fontFamily: {
        mono: ['Fira Code', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}`);

  // Environment file for API Key
  frontend?.file("src/environments/environment.ts", `export const environment = {
  production: false,
  apiKey: 'VOTRE_CLE_API_GEMINI_ICI',
  apiUrl: 'http://localhost:8080/api/notes'
};`);

  // App Module (Not needed if standalone, but good for safety in zip gen)
  // We will generate a Standalone Component based Angular app for simplicity
  frontend?.file("src/main.ts", `import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient()
  ]
}).catch(err => console.error(err));
`);

  // App Component TS
  frontend?.file("src/app/app.component.ts", `import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { GoogleGenAI, Type } from '@google/genai';
import { environment } from '../environments/environment';
import { LucideAngularModule, Terminal, Code, FileText, Link, Settings, AlertTriangle, Search, Plus, Save, X, BrainCircuit, Trash2, Edit } from 'lucide-angular';

interface Note {
  id: string;
  title: string;
  content: string;
  type: string;
  tags: string[];
  createdAt: number;
  lastModified: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './app.component.html',
  styles: []
})
export class AppComponent implements OnInit {
  notes: Note[] = [];
  filteredNotes: Note[] = [];
  searchQuery = '';
  selectedType = 'ALL';
  isModalOpen = false;
  editingNoteId: string | null = null;
  isLoading = false;
  isAiLoading = false;

  // Form
  formTitle = '';
  formContent = '';
  formType = 'SNIPPET';
  formTags = '';

  noteTypes = ['COMMAND', 'SNIPPET', 'PROCEDURE', 'LINK', 'CONFIG', 'ERROR_FIX'];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadNotes();
  }

  loadNotes() {
    this.isLoading = true;
    this.http.get<Note[]>(environment.apiUrl).subscribe({
      next: (data) => {
        this.notes = data.sort((a, b) => b.lastModified - a.lastModified);
        this.filterNotes();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur API', err);
        this.isLoading = false;
        alert('Impossible de contacter le backend Spring Boot. Vérifiez qu\\'il est lancé sur le port 8080.');
      }
    });
  }

  filterNotes() {
    this.filteredNotes = this.notes.filter(note => {
      const matchSearch = note.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                          note.content.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                          note.tags.some(t => t.toLowerCase().includes(this.searchQuery.toLowerCase()));
      const matchType = this.selectedType === 'ALL' || note.type === this.selectedType;
      return matchSearch && matchType;
    });
  }

  openModal(note?: Note) {
    if (note) {
      this.editingNoteId = note.id;
      this.formTitle = note.title;
      this.formContent = note.content;
      this.formType = note.type;
      this.formTags = note.tags.join(', ');
    } else {
      this.editingNoteId = null;
      this.formTitle = '';
      this.formContent = '';
      this.formType = 'SNIPPET';
      this.formTags = '';
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  async analyzeWithGemini() {
    if (!this.formContent) return;
    this.isAiLoading = true;
    
    try {
      const ai = new GoogleGenAI({ apiKey: environment.apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: this.formContent,
        config: {
          systemInstruction: "Tu es un assistant expert Java. Extrait le titre, le type, le contenu formatté et les tags.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              type: { type: Type.STRING },
              formattedContent: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });
      
      const data = JSON.parse(response.text!);
      this.formTitle = data.title;
      this.formType = this.noteTypes.includes(data.type) ? data.type : 'SNIPPET';
      this.formContent = data.formattedContent;
      this.formTags = data.tags.join(', ');
      
    } catch (e) {
      alert("Erreur Gemini. Vérifiez votre clé API dans environment.ts");
    } finally {
      this.isAiLoading = false;
    }
  }

  saveNote() {
    const note: any = {
      title: this.formTitle,
      content: this.formContent,
      type: this.formType,
      tags: this.formTags.split(',').map(t => t.trim()).filter(t => t),
    };

    if (this.editingNoteId) {
      note.id = this.editingNoteId;
      this.http.put(environment.apiUrl + '/' + note.id, note).subscribe(() => {
        this.loadNotes();
        this.closeModal();
      });
    } else {
      this.http.post(environment.apiUrl, note).subscribe(() => {
        this.loadNotes();
        this.closeModal();
      });
    }
  }

  deleteNote(id: string) {
    if(confirm('Supprimer ?')) {
      this.http.delete(environment.apiUrl + '/' + id).subscribe(() => this.loadNotes());
    }
  }
}
`);

  // App Component HTML (Simplifié pour la taille, mais garde le style)
  frontend?.file("src/app/app.component.html", `<div class="min-h-screen bg-slate-900 text-gray-200 font-sans flex flex-col md:flex-row">
  <!-- Sidebar -->
  <aside class="w-full md:w-64 bg-slate-800 border-r border-slate-700 flex flex-col p-4">
    <h1 class="text-xl font-bold text-orange-500 mb-6 flex items-center gap-2">
      DevMemory <span class="text-xs text-gray-500">Angular</span>
    </h1>
    <button (click)="openModal()" class="w-full py-3 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded mb-6 flex items-center justify-center gap-2">
      <lucide-plus size="18"></lucide-plus> Nouvelle Note
    </button>
    <nav class="space-y-1">
      <button (click)="selectedType = 'ALL'; filterNotes()" [class.bg-slate-700]="selectedType === 'ALL'" class="w-full text-left px-3 py-2 rounded text-sm text-gray-400 hover:bg-slate-700">Tout voir</button>
      <button *ngFor="let t of noteTypes" (click)="selectedType = t; filterNotes()" [class.bg-slate-700]="selectedType === t" class="w-full text-left px-3 py-2 rounded text-sm text-gray-400 hover:bg-slate-700">{{t}}</button>
    </nav>
  </aside>

  <!-- Main -->
  <main class="flex-1 flex flex-col h-screen overflow-hidden">
    <header class="p-6 bg-slate-900/80 border-b border-slate-700 flex gap-4">
      <div class="relative flex-1 max-w-2xl">
        <input [(ngModel)]="searchQuery" (ngModelChange)="filterNotes()" type="text" placeholder="Rechercher..." class="w-full pl-4 pr-4 py-3 bg-slate-800 border border-slate-700 rounded text-gray-200">
      </div>
    </header>

    <div class="flex-1 overflow-y-auto p-6 bg-slate-900">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div *ngFor="let note of filteredNotes" class="bg-slate-800 border border-slate-700 rounded p-4 flex flex-col">
          <div class="flex justify-between items-start mb-3">
             <div>
                <h3 class="font-semibold text-gray-100">{{note.title}}</h3>
                <span class="text-xs text-gray-500">{{note.type}}</span>
             </div>
             <div class="flex gap-1">
                <button (click)="openModal(note)" class="p-1 text-gray-400 hover:text-white"><lucide-edit size="14"></lucide-edit></button>
                <button (click)="deleteNote(note.id)" class="p-1 text-gray-400 hover:text-red-400"><lucide-trash-2 size="14"></lucide-trash-2></button>
             </div>
          </div>
          <pre class="text-sm text-gray-300 font-mono bg-slate-900 p-3 rounded mb-3 flex-1 overflow-auto max-h-60">{{note.content}}</pre>
          <div class="flex flex-wrap gap-1">
            <span *ngFor="let tag of note.tags" class="text-xs px-2 py-0.5 bg-slate-700 rounded-full border border-slate-600">#{{tag}}</span>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- Modal -->
  <div *ngIf="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div class="bg-slate-800 w-full max-w-2xl rounded border border-slate-600 flex flex-col max-h-[90vh]">
        <div class="p-4 border-b border-slate-700 flex justify-between">
            <h2 class="text-white font-bold">{{editingNoteId ? 'Modifier' : 'Nouveau'}}</h2>
            <button (click)="closeModal()" class="text-gray-400"><lucide-x size="24"></lucide-x></button>
        </div>
        <div class="p-6 overflow-y-auto">
            <div class="mb-4">
                <label class="text-gray-400 text-xs font-bold uppercase">Contenu</label>
                <textarea [(ngModel)]="formContent" class="w-full h-40 p-3 bg-slate-900 border border-slate-700 rounded text-sm font-mono text-gray-200 mt-1"></textarea>
                <button (click)="analyzeWithGemini()" [disabled]="isAiLoading" class="mt-2 text-xs text-orange-500 font-bold flex items-center gap-2">
                    <lucide-brain-circuit size="14"></lucide-brain-circuit> {{ isAiLoading ? 'Analyse...' : 'Smart Format (Gemini)' }}
                </button>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="text-gray-400 text-xs font-bold uppercase">Titre</label>
                    <input [(ngModel)]="formTitle" type="text" class="w-full p-2 bg-slate-900 border border-slate-700 rounded text-gray-200 mt-1">
                </div>
                <div>
                    <label class="text-gray-400 text-xs font-bold uppercase">Type</label>
                    <select [(ngModel)]="formType" class="w-full p-2 bg-slate-900 border border-slate-700 rounded text-gray-200 mt-1">
                        <option *ngFor="let t of noteTypes" [value]="t">{{t}}</option>
                    </select>
                </div>
            </div>
            <div>
                <label class="text-gray-400 text-xs font-bold uppercase">Tags</label>
                <input [(ngModel)]="formTags" type="text" class="w-full p-2 bg-slate-900 border border-slate-700 rounded text-gray-200 mt-1">
            </div>
        </div>
        <div class="p-4 border-t border-slate-700 flex justify-end gap-2">
            <button (click)="closeModal()" class="px-4 py-2 text-gray-400 text-sm">Annuler</button>
            <button (click)="saveNote()" class="px-6 py-2 bg-orange-600 text-white rounded text-sm font-bold flex items-center gap-2">
                <lucide-save size="16"></lucide-save> Enregistrer
            </button>
        </div>
    </div>
  </div>
</div>`);

  // Index HTML for Angular
  frontend?.file("src/index.html", `<!doctype html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8">
  <title>DevMemory</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
</head>
<body class="bg-slate-900">
  <app-root></app-root>
</body>
</html>`);

  // README
  zip.file("README.md", `# DevMemory
  
  ## Backend (Spring Boot)
  1. Importer le dossier 'backend-springboot' dans IntelliJ/Eclipse.
  2. Créer une base de données MySQL 'devmemory'.
  3. Lancer l'application (Port 8080).
  
  ## Frontend (Angular)
  1. Ouvrir le dossier 'frontend-angular' dans VS Code.
  2. Lancer \`npm install\`.
  3. Configurer votre clé API Gemini dans \`src/environments/environment.ts\`.
  4. Lancer \`npm start\`.
  5. Aller sur http://localhost:4200.
  `);

  // Generate ZIP
  const content = await zip.generateAsync({ type: "blob" });
  
  // Trigger Download
  const url = window.URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = "devmemory-spring-angular.zip";
  a.click();
  window.URL.revokeObjectURL(url);
};