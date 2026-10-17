"""Assemble checksummed public packages and standalone games/art."""
import hashlib,io,json,pathlib,shutil,zipfile
root=pathlib.Path(__file__).resolve().parents[1]
output=root/'_site';output.mkdir(exist_ok=True)
manifest=json.loads((root/'packages/manifest.json').read_text())
for item in manifest:
    names=[p['name'] for p in item.get('parts',[{'name':item['archive']}])]
    data=b''.join((root/'packages'/name).read_bytes() for name in names)
    assert hashlib.sha256(data).hexdigest()==item['sha256'],item['slug']
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        for entry in archive.infolist():
            path=pathlib.PurePosixPath(entry.filename)
            assert not path.is_absolute() and '..' not in path.parts
            assert path.parts[0]==item['slug']
        archive.extractall(output)
shutil.copytree(root/'momikeshi',output/'momikeshi',dirs_exist_ok=True,ignore=shutil.ignore_patterns('test-*.cjs','README.md'))
shutil.copytree(root/'god-hikoza',output/'god-hikoza',dirs_exist_ok=True,ignore=shutil.ignore_patterns('test-*.cjs','README.md'))
shutil.copytree(root/'fractal-mugen',output/'fractal-mugen',dirs_exist_ok=True,ignore=shutil.ignore_patterns('test*.cjs','README.md'))
shutil.copyfile(root/'index.html',output/'index.html')
(output/'.nojekyll').touch()
print(f'Prepared {len(manifest)+3} websites')
