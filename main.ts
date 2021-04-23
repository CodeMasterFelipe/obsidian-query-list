import { App, Modal, Notice, Plugin, PluginSettingTab, Setting, SettingTab, TextAreaComponent, TFile } from 'obsidian';

interface MyPluginSettings {
	//mySetting: string;
	QUERY_TAG: string;
	QUERY_KEYPHRASE: string;
	QUERY_KEYPHRASE_END: string;
}

interface queryInfo {
	"start_i": number;
	"end_i": number;
	"data": string[];
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	//mySetting: 'default',
	QUERY_TAG: 'query',
	QUERY_KEYPHRASE: "<!-- QUERY:",
	QUERY_KEYPHRASE_END: "-->"
}


export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	status_bar: HTMLElement;

	// super() {
	// 	status_bar: this.status_bar;
	// }

	async onload() {
		console.log('loading plugin');

		await this.loadSettings();

		this.status_bar = this.addStatusBarItem();
		this.update_query = this.update_query.bind(this)
		this.registerEvent(this.app.workspace.on("file-open", this.update_query));
		this.registerEvent(this.app.workspace.on("layout-change", this.update_query));
		// not codemirror active-leaf-change
		//yes to layout-change ← check if its only on the active file
		
		this.update_query()
		

		// this.addCommand({
		// 	id: 'open-sample-modal',
		// 	name: 'Open Sample Modal',
		// 	// callback: () => {
		// 	// 	console.log('Simple Callback');
		// 	// },
		// 	checkCallback: (checking: boolean) => {
		// 		let leaf = this.app.workspace.activeLeaf;
		// 		if (leaf) {
		// 			if (!checking) {
		// 				new SampleModal(this.app).open();
		// 			}
		// 			return true;
		// 		}
		// 		return false;
		// 	}
		// });

		this.addSettingTab(new SampleSettingTab(this.app, this));

		// this.registerCodeMirror((cm: CodeMirror.Editor) => {
		// 	console.log('codemirror', cm);
		// });

		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
		
	}

	async update_query() {
		let active_file = this.app.workspace.getActiveFile();
		if(!active_file) {
			this.status_bar.empty();
			return;
		}

		let page_cache = this.app.metadataCache.getFileCache(active_file);
		if(!page_cache || !page_cache.frontmatter || !page_cache.frontmatter.tags) {
			this.status_bar.empty();
			return;
		}

		if (!page_cache.frontmatter.tags.includes(this.settings.QUERY_TAG)) {
			this.status_bar.empty();
			return;
		}

		// after all those checks its sure that the active file has the tag
		// this.status_bar.setText(page_cache.frontmatter.tags);
		let data = await this.app.vault.read(active_file);
		let data_arr = data.split("\n");

		// get all the files so we can check
		let all_files = this.app.vault.getMarkdownFiles();

		//remove the current active file from all_files
		all_files = all_files.filter(function(value) {
			return value != active_file;
		});

		let full_queries: queryInfo[];
		full_queries = [];
		let data_list: string[];
		let start_i = 0
		for (let i = 0; i < data_arr.length; i++) {
			if (data_arr[i].startsWith(this.settings.QUERY_KEYPHRASE)) {
				//let j = i;
				let query = data_arr[i];
				while (!data_arr[i].includes("-->") && i < data_arr.length) {
					i++;
					query += "\n" + data_arr[i];
				}
				console.log(query)
				let resp = await this.searchQuery(query, all_files);
				console.log(resp);
				if (resp["message"] == "END") {
					
					full_queries.push({
						"start_i": start_i,
						"end_i": i,
						"data": data_list
					})
					
				}
				else if (resp["message"] == "START") {
					data_list = resp.data
					start_i = i
				}
			}
		}

		let resp = this.appendQuery(data_arr, full_queries);

		this.app.vault.adapter.write(active_file.path, resp.join("\n"));
		new Notice('File Query updated');

		// for (let i = 0; i < all_files.length; i++) {
		// 	if (all_files[i] == active_file) {
		// 		console.log("THEY ARE THE SAME FILE")
		// 		console.log(all_files[i].basename + " AND " + active_file.basename)
		// 	}
		// }

		
	}

	async searchQuery(query_full: string, query_files: TFile[]) {
		/* 
		Queries example:
			- <!-- QUERY: <source> --> 
				it would look like this if you want to search for the tag #book
				the last QUERY its black, which means its the end of the query block
				and that it should not write anything else after that.

				<!-- QUERY: #book -->

				<!-- QUERY: --> 
		*/
		let query_full_trim = query_full.replace(this.settings.QUERY_KEYPHRASE, "").replace(this.settings.QUERY_KEYPHRASE_END, "").trim();
		//console.log(query + ", l = " + query.length);
		// query = query_full.slice(query_full.indexOf('"') + 1, query_full.lastIndexOf('"')).trim();
		// let query_arr = query.split(" ");
		//let re = "* -- $file_name -- ".replace(/\$file_name/gi, "markdown file name")
		

		let response_list = []; // ← store each of the files found
		let message = "failed"; // ← message should be START or END 
								// depending of what piece of the query it is
		let query_arr = query_full_trim.split("\n");
		let query = query_arr[0];
		let query_format = "* [[$file_name]]";
		if (query_arr.length > 1) {
			for (let i = 1; i < query_arr.length; i++) {
				if (query_arr[i].startsWith("# ")) {
					response_list.push(query_arr[i].replace("# ", ""))
				} else {
					query_format = query_arr[i];
				}
			}
		}
		console.log(query_format);
		

		if (query == "") {
			message = "END"
		} else {
			// check if any of the files have the tag
			for (let i = 0; i < query_files.length; i++) {
					
				let temp = await this.app.vault.read(query_files[i]);
				let temp_arr = temp.split("\n");
				for (let j = 0; j < temp_arr.length; j++) {
					let line = temp_arr[j];
					if (!line.startsWith(this.settings.QUERY_KEYPHRASE) && line.includes(query)) {
						// append the result to reponse_list 
						// and add the '*' to make it a list
						let item = query_format
							.replace(/\$file_name/gi, query_files[i].basename)
							.replace(/\$c_time/gi, new Date(query_files[i].stat.ctime).toString());
						
						let t = query_files[i].stat.ctime;
						
						response_list.push(item);
					}

				}
				message = "START";
			}
		}

		let response = {
			"message": message,
			"data": response_list
		};

		return response;
	}

	appendQuery(rows: string[], query: queryInfo[]) {
		let last_i = 0;
		let result:string[];
		result = []

		for(let i = 0; i < query.length; i++) {
			let q = query[i];
			result = result.concat(rows.slice(last_i, q.start_i + 1));
			if (q.data.length > 0) {
				result = result.concat(q.data);
			} else {
				result.push("*No Response*");
			}
			last_i = q.end_i;
		}
		result = result.concat(rows.slice(last_i))
		return result;
	}

	onunload() {
		console.log('unloading plugin');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	async onOpen() {
		let {contentEl} = this;
		let active_file = this.app.workspace.getActiveFile()
		let page_cache = this.app.metadataCache.getFileCache(active_file)
		contentEl.setText(page_cache.frontmatter.tags);
	}

	onClose() {
		let {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('Tag to use in file')
			.setDesc("It's the tag the plugin recognize to then run the queries. It has to be on the MetaData block")
			.addText(text => text
				.setPlaceholder('query')
				.setValue('query')
				.onChange(async (value) => {
					console.log('Query tag: ' + value);
					//this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Query keyword to insert the query in')
			.setDesc("It's the phrase or word that tell the plugin where the query is located")
			.addText(text => text
				.setPlaceholder('<!-- QUERY:')
				.setValue('<!-- QUERY:')
				.onChange(async (value) => {
					console.log('Query keyphrase: ' + value);
					//this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));

	}
}
