import { Head as SiteHead, Layout } from "../components/layout"

export function Head(_params: undefined, _body: string) {
	return <SiteHead title="About" />
}

export function Body() {
	return (
		<Layout>
			<main>
				<h1>About</h1>
				<p>
					This page exists to make sure the generator handles multiple
					routes. Go back to the <a href="/">home page</a>.
				</p>
			</main>
		</Layout>
	)
}
