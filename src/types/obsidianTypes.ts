declare module "obsidian" {
	interface DataAdapter {
		basePath: string;
	}

	interface MenuItem {
		setSubmenu(): Menu;
	}
}

export {};
