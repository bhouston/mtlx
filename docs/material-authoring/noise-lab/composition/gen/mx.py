# Tiny MaterialX nodegraph writer for lab swatches. ponytail: no validation; `cli check --strict` does that.
class G:
    def __init__(self, name):
        self.name, self.lines, self.types, self.outs, self.i = name, [], {}, [], 0

    def _in(self, k, v, ntype):
        if isinstance(v, Ref):
            t = self.types[v.name] if v.out is None else 'float'
            o = f' output="{v.out}"' if v.out else ''
            return f'<input name="{k}" type="{t}" nodename="{v.name}"{o} />'
        if isinstance(v, tuple) and isinstance(v[0], str) and v[0] in ('float', 'integer', 'vector2', 'vector3', 'color3', 'boolean'):
            t, v = v
        elif isinstance(v, bool):
            t = 'boolean'
        elif isinstance(v, int) and k in ('octaves', 'style', 'metric'):
            t = 'integer'
        elif isinstance(v, (int, float)):
            t = 'float'
        elif len(v) == 2:
            t = 'vector2'
        else:
            t = 'vector3' if ntype == 'vector3' else 'color3'
        s = ', '.join(str(x) for x in v) if isinstance(v, (tuple, list)) else str(v).lower() if isinstance(v, bool) else str(v)
        return f'<input name="{k}" type="{t}" value="{s}" />'

    def n(self, op, typ='float', name=None, comment=None, **ins):
        self.i += 1
        name = name or f'{op}_{self.i}'
        if comment:
            self.lines.append(f'    <!-- {comment} -->')
        self.types[name] = typ
        body = ''.join(self._in(k.rstrip('_'), v, typ) for k, v in ins.items())
        self.lines.append(f'    <{op} name="{name}" type="{typ}">{body}</{op}>')
        return Ref(name)

    def out(self, name, typ, ref):
        self.outs.append(f'    <output name="{name}" type="{typ}" nodename="{ref.name}" />')

    def xml(self, header, surface):
        """surface: dict input-> ('out', outname) | value tuple/number."""
        nm = self.name
        srf = []
        for k, v in surface.items():
            if isinstance(v, tuple) and v[0] == 'out':
                t = [o for o in self.outs if f'name="{v[1]}"' in o][0].split('type="')[1].split('"')[0]
                srf.append(f'    <input name="{k}" type="{t}" nodegraph="NG_{nm}" output="{v[1]}" />')
            else:
                srf.append('    ' + self._in(k, v, 'color3' if 'color' in k else 'float'))
        return (f'<?xml version="1.0"?>\n<materialx version="1.39" colorspace="lin_rec709">\n  <!-- {header} -->\n'
                f'  <nodegraph name="NG_{nm}">\n' + '\n'.join(self.lines + self.outs) + '\n  </nodegraph>\n'
                f'  <standard_surface name="SR_{nm}" type="surfaceshader">\n' + '\n'.join(srf) + '\n  </standard_surface>\n'
                f'  <surfacematerial name="M_{nm}" type="material"><input name="surfaceshader" type="surfaceshader" nodename="SR_{nm}" /></surfacematerial>\n</materialx>\n')


class Ref:
    def __init__(self, name, out=None):
        self.name, self.out = name, out


# ---- helpers -----------------------------------------------------------------
def basics(g):
    uv = g.n('texcoord', 'vector2', name='uv')
    g.n('separate2', 'multioutput', name='uv_sep', in_=uv)
    return uv, Ref('uv_sep', 'outx'), Ref('uv_sep', 'outy')


def normal(g, height, uv):
    """AUTHORING.md millimeter workaround; height in meters."""
    uvmm = g.n('multiply', 'vector2', name='uv_mm', in1=uv, in2=1000)
    hmm = g.n('multiply', name='height_mm', in1=height, in2=1000)
    nt = g.n('heighttonormal', 'vector3', name='n_tangent', in_=hmm, scale=16, texcoord=uvmm)
    return g.n('normalmap', 'vector3', name='n_world', in_=nt)


def std(g, header, color, rough, nrm, metal=None):
    g.out('base_color_out', 'color3', color)
    g.out('roughness_out', 'float', rough)
    if nrm is not None:
        g.out('normal_out', 'vector3', nrm)
    m = metal or g.n('constant', name='metalness', value=0.0)
    g.out('metalness_out', 'float', m)
    s = {'base': 1.0, 'base_color': ('out', 'base_color_out'), 'specular': 0.5, 'specular_IOR': 1.5,
         'specular_roughness': ('out', 'roughness_out'), 'metalness': ('out', 'metalness_out')}
    if nrm is not None:
        s['normal'] = ('out', 'normal_out')
    return g.xml(header, s)


def noise(g, uv, freq, amp, kind='noise2d', name=None, **kw):
    """Signed noise (about +-0.5*amp) at `freq` features per meter (freq may be a vector2 for stretching)."""
    p = g.n('multiply', 'vector2', in1=uv, in2=freq)
    return g.n(kind, name=name, texcoord=p, amplitude=amp, **kw)


def lod_fine(g, uv, J0, tag):
    """1 where the pixel footprint in UV (m^2 per pixel) is below J0, else 0. Abuses the three.js
    heighttonormal degenerate test |n|^2 < 1e-12; binary, per 2x2 quad. See FINDINGS.md."""
    x = Ref('uv_sep', 'outx')
    s = (1e-7 / J0) ** 0.5
    tc = g.n('multiply', 'vector2', in1=uv, in2=s)
    hn = g.n('heighttonormal', 'vector3', in_=x, scale=160 * s, texcoord=tc)
    g.n('separate3', 'multioutput', name=f'{tag}_sep', in_=hn)
    return g.n('ifgreater', name=tag, value1=Ref(f'{tag}_sep', 'outz'), value2=0.8, in1=1.0, in2=0.0)


def quadrants(g, x, y):
    r = g.n('ifgreater', name='q_right', value1=x, value2=0.5, in1=1.0, in2=0.0)
    t = g.n('ifgreater', name='q_top', value1=y, value2=0.5, in1=1.0, in2=0.0)
    return r, t


def grid_select(g, x, y, cells, ncol=3, typ='float', tag='cell'):
    """cells[row][col] (row 0 = bottom). Picks the value for the cell containing (x, y)."""
    c = g.n('floor', name=f'{tag}_col', in_=g.n('multiply', in1=x, in2=float(ncol)))
    r = g.n('floor', name=f'{tag}_row', in_=g.n('multiply', in1=y, in2=float(len(cells))))
    rows = []
    for row in cells:
        v = row[0]
        for i in range(1, ncol):
            v = g.n('ifgreater', typ, value1=c, value2=i - 0.5, in1=row[i], in2=v)
        rows.append(v)
    v = rows[0]
    for i in range(1, len(rows)):
        v = g.n('ifgreater', typ, value1=r, value2=i - 0.5, in1=rows[i], in2=v)
    return v


def smax(g, a, b, k):
    """Polynomial smooth max: max(a,b) + h^2*k/4, h = max(k-|a-b|,0)/k."""
    h = g.n('divide', in1=g.n('max', in1=g.n('subtract', in1=k, in2=g.n('absval', in_=g.n('subtract', in1=a, in2=b))), in2=0.0), in2=k)
    return g.n('add', in1=g.n('max', in1=a, in2=b), in2=g.n('multiply', in1=g.n('multiply', in1=h, in2=h), in2=k / 4))
