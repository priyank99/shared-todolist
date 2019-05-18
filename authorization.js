const node_acl = require('acl');
const mongoose = require("mongoose"),
    List = require("./models/list"),
    User = require("./models/user");
const async = require('async');

const allRoles = ['owner', 'add', 'read', 'order', 'edit', 'delete'];

function PromiseAcl() {
    return new Promise(function (resolve, reject) {
        mongoose.connection.on('connected', function (error) {
            if (error)
                return reject(err);
            acl = new node_acl(new node_acl.mongodbBackend(mongoose.connection.db, 'nacl_'));
            console.log("acl connected to db");
            //console.log(acl);
            resolve(acl);
        });
    });
}

function writeAcessRoles(acl, listIdstr) {
    acl.allow('owner_' + listIdstr, listIdstr, '*');
    acl.allow('add_' + listIdstr, listIdstr, 'add');
    acl.allow('read_' + listIdstr, listIdstr, 'read');
    acl.allow('order_' + listIdstr, listIdstr, ['read', 'order']);
    acl.allow('edit_' + listIdstr, listIdstr, ['read', 'order', 'edit']);
    acl.allow('delete_' + listIdstr, listIdstr, ['read', 'order', 'delete']);

}

function grantAcess(acl, userId, role, listIdstr) {
    return new Promise((resolve, reject) => {
        if (allRoles.includes(role)) {
            console.log('granted ' + role + ' on ' + listIdstr);
            acl.addUserRoles(userId.toString(), role + '_' + listIdstr, function () {
                acl.allowedPermissions(userId.toString(), listIdstr, function (err, permissions) {
                    if (err) {
                        reject(err);
                    }

                    async.parallel({
                        addlist: function (cb) {
                            User.findByIdAndUpdate(userId, {$addToSet: {all_lists: listIdstr}
                                }, {safe: true,
                                    upsert: true}, cb);
                        },
                        addcollaborator: function (cb) {
                            List.findByIdAndUpdate(listIdstr, { $addToSet: {collaborators: userId}
                                }, {safe: true,
                                    upsert: true}, cb);
                        }
                    }, function (err, results) {
                        if (err) {
                            console.log(err);
                            reject(err);
                        }
                        else{
                            console.log(permissions)
                            resolve(permissions);
                        }
                    });

                });
            });
        } else {
            console.log('invalid role');
            reject('err: invalid role');
        }
    })
}

function revokeAcess(acl, userId, role, listIdstr) {
    return new Promise((resolve, reject) => {
        if (allRoles.includes(role)) {
            console.log('revoke ' + role + ' on ' + listIdstr);
            acl.removeUserRoles(userId.toString(), role + '_' + listIdstr, function () {
                acl.allowedPermissions(userId.toString(), listIdstr, function (err, permissions) {
                    if (err) {
                        reject(err);
                    }

                    console.log(permissions);
                    console.log(permissions[listIdstr].length == 0);
                    if (permissions[listIdstr].length == 0) {
                        async.parallel({
                            removelist: function (cb) {
                                User.findByIdAndUpdate(userId, {$pull: {all_lists: listIdstr}
                                    }, {safe: true,
                                        upsert: true}, cb);
                            },
                            removecollaborator: function (cb) {
                                List.findByIdAndUpdate(listIdstr, { $pull: {collaborators: userId}
                                    }, {safe: true,
                                        upsert: true}, cb);
                            }
                        }, function (err, results) {
                            if (err) {
                                console.log(err);
                                reject(err);
                            }
                            else{
                                console.log('removed collaborator ' + userId.toString() + ' from ' + listIdstr);
                                resolve(permissions);
                            }
                        });
                    }
                    else {
                        resolve(permissions);
                    }
                });
            });
        } else {
            console.log('invalid role');
            reject('err: invalid role');
        }
    })
}


module.exports = {
    writeAcessRoles,
    grantAcess,
    revokeAcess,
    allRoles,
    PromiseAcl
}