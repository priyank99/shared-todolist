const express = require("express"),
  router = express.Router(),
  middleware = require("../middleware"),
  List = require("../models/list"),
  User = require("../models/user");

var authorize = require("../authorization"),
  writeAcessRoles = require("../authorization").writeAcessRoles,
  grantAcess = require("../authorization").grantAcess;

/*
#show lists
/  in JSON
/all  in JSON, including shared lists
/:listid    GET that list

#add, remove td list
/create               GET   ,name, access form         GET
/                     POST  ,list.create  from body  redir to /:listid         POST
//  EDIT
/edit/:listid         GET   ,name, access form         GET
/:listid              PUT   ,diff update that list,   change name

/:listid              DEL



#todos

/:listid/todos          GET   ,all in listid
/:listid/todos          POST  ,insert new todo in list, increment total count

/:listid/todos/:todoid  GET todo using todoid
/:listid/todos/:todoid  PUT edit todo using todoid

/:listid/todos/:todoid/reorder  POST    reorder using req.body.reorderStep

#sharing

/grant/:id/           POST  grant to specific user only if you have access to that list 
/revoke/:id/          POST  revoke from specific user only if you have access to that list 
/checkaccess/:id/     POST  get all permissions on that list, 
                            [] if no access, ['*'] if owner 


*/
function sortByOrderId(ilistA, ilistB) {
  console.log(ilistA);
  console.log(ilistB);
  let x = ilistA.orderedId;
  let y = ilistB.orderedId;
  return ((x < y) ? -1 : ((x > y) ? 1 : 0));
}
var acl;
authorize.PromiseAcl().then(function (aclobj) {
  //console.log(aclobj);
  acl = aclobj;
}).catch((err) => setImmediate(() => {
  throw err;
}));

router.get('/all', middleware.isLoggedIn, function (req, res) {

  User.findById(req.user._id, function (err, user) {
    if (err) {
      console.log(err);
      return res.status(500).send();
    }
    console.log(user);
    List.find({
      '_id': {
        $in: user.all_lists
      }
    }, function (err, lists) {
      if (err) {
        console.log(err);
        return res.status(400).send('invalid request');
      } else {
        console.log(lists);
        return res.json(lists);
      }
    })

  })

});

router.get("/create", middleware.isLoggedIn, (req, res) => res.render("index"));

router.get('/', middleware.isLoggedIn, function (req, res) {

  List.find({
    ownerId: req.user._id
  }).lean().exec(function (err, lists) {
    if (err) {
      console.log(err);
      return res.status(400).send('invalid request');
    } else {
      //console.log(lists);
      res.json(lists);
    }
  });

});
router.get('/:id', middleware.isLoggedIn, function (req, res) {
  List.findById(req.params.id, function (err, list) {

    if (err) {
      console.log(err);
      return res.status(400).send('invalid request');
    } else if (list) {
      console.log("else ift");

      acl.isAllowed(req.user._id.toString(), list._id.toString(), 'read', function (err, allowed) {
        if (allowed) {
          console.log("user " + req.user._id.toString() + " allowed to " + 'read' + list._id.toString())
          acl.allowedPermissions(req.user._id.toString(), list._id.toString(), function (err, permissions) {
            console.log(permissions)
          })
          return res.json(list);
        } else {
          console.log("else not");
          return res.status(401).send();
        }
      });

    } else {
      return res.status(404).send();
    }
  });

});

router.post('/', middleware.isLoggedIn, function (req, res) {

  console.log(acl.allow);
  let newlist = {
    name: req.body.name,
    ownerId: req.user._id,
  }

  console.log(newlist);
  List.create(newlist, function (err, list) {
    if (err) {
      console.log(err);
      return res.status(400).send('invalid request');
    } else {
      writeAcessRoles(acl, list._id.toString());
      grantAcess(acl, list.ownerId, 'owner', list._id.toString());

      return res.json(list);
    }
  });

});

router.delete("/:id", middleware.isLoggedIn, function (req, res) {
  List.findOneAndRemove({
      ownerId: req.user._id,
      '_id': req.params.id,
    }).then(function (del_list) {
      req.flash("success", "list deleted!");

      console.log('del_list.collaborators');
      console.log(del_list.collaborators);
      let criteria = {
        '_id': {
          $in: del_list.collaborators
        }
      };
      let action = {
        $pull: {
          all_lists: del_list._id
        }
      };
      User.updateMany(criteria, action, {
          safe: true
        },
        function (err, result) {
          if (err) {
            console.log(err);
            return res.status(400).send('invalid request');
          } else {
            console.log(result);
            console.log("deleted list ");
            //console.log(del_list);
            res.json(del_list);
          }
        }
      )


    })
    .catch(err => {
      req.flash("error", "del error");
      console.error(err);
      res.redirect("/user/login");

    });
});

router.put("/:id", middleware.isLoggedIn, function (req, res) {
  req.body.updated = Date.now();
  List.findOneAndUpdate({
    ownerId: req.user._id,
    '_id': req.params.id,
  }, req.body, function (err, list) {
    if (err) {
      console.log(err);
      return res.status(400).send('invalid request');
    }
    if (!list) {
      console.log("not found tp up");
      return res.status(404).send('list does not exist');
    } else {
      console.log("updated");
      return res.status(204).send();
    }
  });
});
/*
============================================== todos ==================================================
*/
router.get('/:id/todos', middleware.isLoggedIn, function (req, res) {

  List.findById(req.params.id, function (err, list) {
    if (err) {
      console.log(err);
      return res.status(400).send('invalid request');
    } else if (list) {

      acl.isAllowed(req.user._id.toString(), req.params.id.toString(), 'read', function (err, allowed) {
        if (allowed) {
          console.log("user " + req.user._id.toString() + ' allowed to ' + 'read' + req.params.id.toString())
          acl.allowedPermissions(req.user._id.toString(), req.params.id.toString(), function (err, permissions) {
            console.log(permissions)
          })
          console.log(list.itemList);
          return res.json(list.itemList);
        } else {
          console.log("else not");
          return res.status(401).send();
        }
      });

    } else {
      return res.status(404).send();
    }
  });

});

router.get('/:id/todos/:todoid', middleware.isLoggedIn, function (req, res) {

  List.findById(req.params.id, function (err, list) {
    if (err) {
      console.log(err);
      return res.status(400).send('invalid request');
    } else if (list) {

      acl.isAllowed(req.user._id.toString(), req.params.id.toString(), 'read', function (err, allowed) {
        if (allowed) {
          console.log("user " + req.user._id.toString() + ' allowed to ' + 'read' + req.params.id.toString())
          console.log(list.itemList.id(req.params.todoid));
          return res.json(list.itemList.id(req.params.todoid));
        } else {
          return res.status(401).send();
        }
      });

    } else {
      return res.status(404).send();
    }
  });

});

router.post('/:id/todos', middleware.isLoggedIn, function (req, res) {
  let newtodo = {
    text: req.body.text,
  }

  List.findById(req.params.id, function (err, list) {
    if (err) {
      console.log(err);
      return res.status(400).send('invalid request');
    } else if (list) {

      acl.isAllowed(req.user._id.toString(), req.params.id.toString(), 'add', function (err, allowed) {
        if (allowed) {
          console.log("user " + req.user._id.toString() + ' allowed to ' + 'add' + req.params.id.toString())
          acl.allowedPermissions(req.user._id.toString(), req.params.id.toString(), function (err, permissions) {
            console.log(permissions)
          })

          list.numItems += 1;
          newtodo['orderedId'] = list.numItems;
          list.itemList.push(newtodo);
          let listLength = list.itemList.length;
          for (let i = 0; i < listLength; i++) {
            list.itemList[i].orderedId = i + 1;
            console.log(list.itemList[i]);
          }
          list.itemList.sort(sortByOrderId);
          list.save(function (err) {
            if (err) {
              console.log('err!');
              return res.send(err);
            } else {
              console.log(list);
              return res.status(201).json(list);
            }
          });

        } else {
          console.log("else not");
          return res.status(401).send();
        }
      });

    } else {
      return res.status(404).send();
    }

  });

});

router.delete('/:id/todos/:todoid', middleware.isLoggedIn, function (req, res) {
  List.findById(req.params.id, function (err, list) {
    if (err) {
      console.log(err);
      return res.status(400).send('invalid request');
    } else if (list) {

      acl.isAllowed(req.user._id.toString(), req.params.id.toString(), 'delete', function (err, allowed) {
        if (allowed) {
          console.log("user " + req.user._id.toString() + ' allowed to ' + 'delete' + req.params.id.toString())
          acl.allowedPermissions(req.user._id.toString(), req.params.id.toString(), function (err, permissions) {
            console.log(permissions)
          })

          if (list.itemList.id(req.params.todoid)) {
            list.itemList.id(req.params.todoid).remove();
            list.numItems -= 1;

            let listLength = list.itemList.length;
            for (let i = 0; i < listLength; i++) {
              list.itemList[i].orderedId = i + 1;
              console.log(list.itemList[i]);
            }

            list.save(function (err) {
              if (err)
                return res.send(err);
              else {
                console.log("deleted");
                return res.status(204).send();
              }
            });
          } else {
            console.log("del-td: todo not found");
            return res.status(404).send('not found: todo');
          }

        } else {
          console.log("else not");
          return res.status(401).send();
        }
      });

    } else {
      return res.status(404).send();
    }

  });

});

router.put('/:id/todos/:todoid', middleware.isLoggedIn, function (req, res) {
  List.findById(req.params.id, function (err, list) {
    if (err) {
      console.log(err);
      return res.status(400).send('invalid request');
    } else if (list) {

      acl.isAllowed(req.user._id.toString(), req.params.id.toString(), 'edit', function (err, allowed) {
        if (allowed) {
          console.log("user " + req.user._id.toString() + ' allowed to ' + 'edit' + req.params.id.toString())
          acl.allowedPermissions(req.user._id.toString(), req.params.id.toString(), function (err, permissions) {
            console.log(permissions)
          })

          if (list.itemList.id(req.params.todoid)) {

            if (req.body.text)
              list.itemList.id(req.params.todoid).text = req.body.text;
            if (req.body.done)
              list.itemList.id(req.params.todoid).done = req.body.done;
            if (req.body.orderedId)
              list.itemList.id(req.params.todoid).orderedId = req.body.orderedId;
            console.log(list.itemList.id(req.params.todoid));
            list.itemList.sort(sortByOrderId);
            console.log(list);

            list.save(function (err) {
              if (err)
                return res.send(err);
              else {
                console.log("updated");
                return res.status(204).send();
              }
            });
          } else {
            console.log("upd-td: todo not found");
            return res.status(404).send('not found: todo');
          }

        } else {
          console.log("else not");
          return res.status(401).send();
        }
      });

    } else {
      return res.status(404).send();
    }


  });

});


router.post('/:id/todos/:todoid/reorder', middleware.isLoggedIn, function (req, res) {
  List.findById(req.params.id, function (err, list) {
    if (err) {
      console.log(err);
      return res.status(400).send('invalid request');
    } else if (list) {

      acl.isAllowed(req.user._id.toString(), req.params.id.toString(), 'order', function (err, allowed) {
        if (allowed) {
          console.log("user " + req.user._id.toString() + ' allowed to ' + 'order' + req.params.id.toString())
          acl.allowedPermissions(req.user._id.toString(), req.params.id.toString(), function (err, permissions) {
            console.log(permissions)
          })

          if (list.itemList.id(req.params.todoid)) {

            if (req.body.done)
              list.itemList.id(req.params.todoid).done = req.body.done;
            if (req.body.reorderStep) {
              console.log(req.params.todoid);
              let curIdx = list.itemList.id(req.params.todoid).orderedId - 1; //list.itemList.indexOf(req.params.todoid);
              let targetIdx = curIdx + parseInt(req.body.reorderStep);
              list.itemList.id(req.params.todoid).orderedId += parseInt(req.body.reorderStep);
              console.log(list.itemList.id(req.params.todoid));
              console.log(curIdx);
              console.log(targetIdx);
              list.itemList.splice(targetIdx, 0, list.itemList.splice(curIdx, 1)[0]);

              console.log("list before sort");
              console.log(list);
              list.itemList.sort(sortByOrderId);
              let listLength = list.itemList.length;
              for (let i = 0; i < listLength; i++) {
                list.itemList[i].orderedId = i + 1;
                //console.log(list.itemList[i]);
              }
            }
            console.log(list);
            list.save(function (err) {
              if (err)
                return res.send(err);
              else {
                console.log("updated");
                return res.status(204).send();
              }
            });
          } else {
            console.log("reorder-td: todo not found");
            return res.status(404).send('not found: todo');
          }

        } else {
          console.log("else not");
          return res.status(401).send();
        }
      });
    } else {
      return res.status(404).send();
    }

  });

});

/*
============================================ /list/share/:listid ==================================
*/

router.post('/grant/:id/', middleware.isLoggedIn, function (req, res) {
  /*
  listid  :params url
  recid : receiver id
  role  :  role granted
  */
  let listid = req.params.id,
    userid = req.user._id,
    recid = req.body.recid,
    role = req.body.role;

  List.findById(listid, function (err, list) {
    if (err || !(authorize.allRoles.includes(role))) {
      console.log(err);
      return res.status(400).send('invalid request');
    }
    if (!list) {
      console.log("share-tdlst: list not found");
      return res.status(404).send('not found: list');
    } else {
      acl.isAllowed(userid.toString(), listid.toString(), role, function (err, allowed) {
        if (allowed) {
          console.log("user " + userid.toString() + ' granting ' + role + ' on ' + listid.toString() + ' to ' + recid.toString());

          authorize.grantAcess(acl, recid, role, listid.toString()).then(permissions => {
              return res.status(201).json(permissions);
            })
            .catch(error => {
              console.log(error);
              return res.status(500).send();
            });

        } else {
          console.log("else not allowed");
          return res.status(401).send();
        }
      });

    }
  })
})

router.post('/revoke/:id/', middleware.isLoggedIn, function (req, res) {
  /*
  listid  :params url
  recid : receiver id
  role  :  role to revoke
  */
  let listid = req.params.id,
    userid = req.user._id,
    recid = req.body.recid,
    role = req.body.role;

  List.findById(listid, function (err, list) {
    if (err) {
      console.log(err);
      return res.status(400).send('invalid request');
    }
    if (!list) {
      console.log("revoke-tdlst: list not found");
      return res.status(404).send('not found: list');
    } else {
      acl.isAllowed(userid.toString(), listid.toString(), role, function (err, allowed) {
        if (allowed) {
          console.log("user " + userid.toString() + ' revokes ' + role + ' on ' + listid.toString() + ' from ' + recid.toString());
          authorize.revokeAcess(acl, recid, role, listid.toString()).then(permissions => {
              return res.status(201).json(permissions);
            })
            .catch(error => {
              console.log(error);
              return res.status(500).send();
            });
        } else {
          console.log("else not allowed");
          return res.status(401).send();
        }
      });

    }
  })
})

router.get('/checkaccess/:id/', middleware.isLoggedIn, function (req, res) {

  let listid = req.params.id,
    userid = req.user._id;

  List.findById(listid, function (err, list) {
    if (err) {
      console.log(err);
      return res.status(400).send('invalid request');
    }
    if (!list) {
      console.log("share-tdlst: list not found");
      return res.status(404).send('not found: list');
    } else {
      acl.allowedPermissions(userid.toString(), listid, function (err, permissions) {
        if (err) {
          return res.status(500).send('error while checking permissions');
        }
        console.log(permissions)
        return res.status(200).send(permissions);
      });

    }
  })
})


module.exports = router;