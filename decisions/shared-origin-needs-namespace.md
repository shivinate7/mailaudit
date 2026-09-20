# The Pages origin is shared, so storage is namespaced

Every repository the user hosts on GitHub Pages shares one origin. That is the reason every stored key carries the same namespace prefix. It is also the reason the storage quota is shared with any other project on that origin.

## The argument, as recorded

```
Note `shivinate7.github.io` is a single origin across every repo the user has
on Pages — hence the `mailday:` key namespace, and hence a per-origin storage
quota shared with any other Pages project.
```
