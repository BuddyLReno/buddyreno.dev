import { experimental_AstroContainer as AstroContainer } from 'astro/container';

type Renderable = Parameters<AstroContainer['renderToString']>[0];
interface RenderOptions {
  props?: Record<string, unknown>;
  slots?: Record<string, string>;
  request?: Request;
}

let container: AstroContainer | undefined;

export async function render(component: Renderable, options: RenderOptions = {}): Promise<string> {
  container ??= await AstroContainer.create({ astroConfig: { site: 'https://buddyreno.dev' } });
  return container.renderToString(component, options);
}
