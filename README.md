## Obsidian Query List Plugin

**Purpose:** This plugin runs queries to find the files that contains the information wanted, and then write them into the file directly rather than just render it only in "preview" mode.

This plugin is to use in the note taking app: [Obsidian.md](https://obsidian.md)

#### How to use:

In the file you wish to run a query you will have to add the tag "query" in the YALM MetaData block on the top of the file:

```
---
tags: [query]
---
```

If that exist in the file the plugin will go ahead and search the location of the query block. I choose to use a HTML comments for this since it will never render in most places that you will try to load the the .md file

```
<!-- QUERY: "list tag #tag-to-search " --> 

<!-- QUERY: "end" -->
```

The query is `list tag #<tag>`. List tell the query that should return the files in a  Markdown format. Tag tell to search tags. And the last piece its the tag to search.

Every Query block is made of two pieces. The first one its, `<!-- QUERY: "list tag #tag-to-search " --> `, which indicates the start of the query, and where it should write the response. The second is simple but important, `<!-- QUERY: "end" -->`, this will tell until where it can modify the file.

#### Example:

let's say you have a file named "Test.md" which looks something like this:

># Test
>This is a test file to show how this plugin works.
>#tag-to-find
>
>It doesn't matter where the tag is in this file, as long as in this file

Then the file that have the query will look something like this:

> # File to Run Query
>
> We want to run the query after this:
>
> \<!-- QUERY: "list tag #tag-to-search " --> 
>
> * [[Test]]
>
> \<!-- QUERY: "end" -->
>
> Then something else can go here. The plugin workspace its just between thos two HTML comments.

I scaped those commets so It can be visible, but in Obsidian preview mode it wont render.

Also this plugin will update the table if need if the file is in focus, or when you change from "edit" to "preview" mode.