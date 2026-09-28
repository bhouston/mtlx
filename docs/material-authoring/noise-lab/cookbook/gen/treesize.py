# Expanded-tree size of each nodegraph output: the loader seems not to share nodes between consumers, so compile time
# tracks this, not the node count. `python3 treesize.py f.mtlx [N]` (N: also list the N largest subtrees). Keep it under ~300k.
import re,sys,functools
s=open(sys.argv[1]).read()
nodes={}
for m in re.finditer(r'<(\w+) name="(\w+)" type="[\w]+">(.*?)</\1>',s):
    nodes[m.group(2)]=(m.group(1),re.findall(r'nodename="(\w+)"',m.group(3)))
@functools.lru_cache(None)
def size(n):
    op,ins=nodes[n]; return 1+sum(size(i) for i in ins if i in nodes)
outs=re.findall(r'<output name="\w+" type="\w+" nodename="(\w+)"',s)
print(sys.argv[1].split('/')[-1], 'nodes',len(nodes),'tree',sum(size(o) for o in outs))
if len(sys.argv)>2:
    for n in sorted(nodes,key=size)[-int(sys.argv[2]):]: print(' ',n,nodes[n][0],size(n))
