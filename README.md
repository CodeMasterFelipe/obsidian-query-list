## Obsidian Query List Plugin

**Purpose:** This plugin runs queries to find the files that contains the information wanted, and then write them into the file directly rather than just render it only in "preview" mode.

This plugin is to use in the note taking app: [Obsidian.md](https://obsidian.md)

#### How to use:

In the file you wish to run a query you will have to add the tag "query" in the YALM MetaData block on the top of the file:

```yaml
---
tags: [query]
---
```

If that exist in the file the plugin will go ahead and search the location of the query block. I choose to use a HTML comments for this since it will never render in most places that you will try to load the the .md file

```html
<!-- QUERY: #tag-to-search --> 

<!-- QUERY: -->
```

The query is everything in between `<!-- QUERY:` and `-->`. In the case above its `#tag-to-search`. This plugin will search in all the Markdown files for that tag. It also can search words, sentences, even links to other notes. For the later, should look like this:

```html
<!-- QUERY: [[Name of File --> 
```

I usually leave the link expresion unfinished because some of my links have the '|' symbol to change the alias. So in this way it assure me that it will return all of the file no matter the alias use to link them.

Every Query block is made of two pieces. The first one its, `<!-- QUERY: #tag-to-search --> `, which indicates the start of the query, and where it should write the response. The second is simple but important, `<!-- QUERY: -->`, this will tell until where to stop / can modify the file. If the the stop query is missing, then it wont write anything.

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
> \<!-- QUERY: #tag-to-search --> 
>
> * [[Test]]
>
> \<!-- QUERY: -->
>
> Then something else can go here. The plugin workspace its just between thos two HTML comments.

I scaped those HTML commets so It can be visible, but in Obsidian preview mode it wont render.

### Change the Default Format

The default format in which it write the response is: `* [[$file_name]]`

#### Current Variables:

* $file_name : it's the name of the file.
* $c_time : it the time and date of creation of the file.

To change the format, a new line in the 'QUERY' should be created:

```html
<!-- QUERY: #tag-to-search 
* [[$file_name]] -->
```

You can have many different lines, but **only** the last will be use as the format for each result.

You can also have header denoted by `#<space>`

```html
<!-- QUERY: #tag-to-search 
# This is a Header
# # This is a h1 header
# ## h2 header
-->
```

#### Some Ideas for formats

You can create a table

```html
<!-- QUERY: #tag-to-search 
# | Name | Creation |
# | ---- | -------- |
| [[$file_name]] | $c_time |
-->
<!-- QUERY -->
```



### When does It update the information?

This plugin uses events to detect when you have focus on a file and when you change the view ("preview", "edit"). it wont try to update if you are in another file.