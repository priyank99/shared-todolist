# shared-todolist

A REST api in Node.js for a Todo list app which can allow users to share todo lists with collaborators

### show lists
```
/           user's lists in JSON
/all        all lists in JSON, including shared lists

/:listid              GET that list
/                     POST  create new list
/:listid              PUT   change name of that list, 
/:listid              DEL   delete that list,
```

Only authorized users can access or modify a list.
### todos
```
/:listid/todos          GET   all in that listid
/:listid/todos          POST  insert new todo in list, increment total count

/:listid/todos/:todoid  GET todo using :todoid
/:listid/todos/:todoid  PUT edit todo using :todoid
/:listid/todos/:todoid  DEL delete todo using :todoid

/:listid/todos/:todoid/reorder  POST    reorder using req.body.reorderStep
```

### sharing
```
/grant/:id/           POST  grant to specific user only if you have access to that list 
/revoke/:id/          POST  revoke from specific user only if you have access to that list 
/checkaccess/:id/     POST  get all permissions you have on that list
```
