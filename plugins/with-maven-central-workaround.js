const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  withDangerousMod,
  withGradleProperties,
} = require('expo/config-plugins');

/**
 * EAS Android workers share Maven Central IPs. Sonatype now returns HTTP 429,
 * and Gradle treats that as a hard failure even when the Expo AAR already
 * exists in each module's local-maven-repo.
 *
 * This plugin:
 * 1. Lengthens Gradle HTTP timeouts so a 429 has room to retry.
 * 2. Installs a Gradle init script that stops Maven Central from being
 *    queried for Expo prebuilt coordinates (expo.modules.* / host.exp.exponent).
 */
const INIT_SCRIPT = `import org.gradle.api.artifacts.repositories.MavenArtifactRepository

def isMavenCentral(MavenArtifactRepository repo) {
    def url = repo.url?.toString() ?: ""
    return url.contains("repo.maven.apache.org/maven2") || url.contains("repo1.maven.org/maven2")
}

def filterExpoFromMavenCentral = { MavenArtifactRepository repo ->
    if (!isMavenCentral(repo)) {
        return
    }
    repo.content {
        excludeGroupByRegex("expo\\\\.modules.*")
        excludeGroup("host.exp.exponent")
    }
}

settingsEvaluated { settings ->
    settings.pluginManagement.repositories.withType(MavenArtifactRepository).configureEach {
        filterExpoFromMavenCentral(it)
    }
    settings.dependencyResolutionManagement.repositories.withType(MavenArtifactRepository).configureEach {
        filterExpoFromMavenCentral(it)
    }
}

gradle.beforeProject { project ->
    project.buildscript.repositories.withType(MavenArtifactRepository).configureEach {
        filterExpoFromMavenCentral(it)
    }
    project.repositories.withType(MavenArtifactRepository).configureEach {
        filterExpoFromMavenCentral(it)
    }
}
`;

function upsertGradleProperty(props, key, value) {
  const existing = props.find((item) => item.type === 'property' && item.key === key);
  if (existing) {
    existing.value = value;
    return;
  }
  props.push({ type: 'property', key, value });
}

function withMavenCentralWorkaround(config) {
  config = withGradleProperties(config, (mod) => {
    upsertGradleProperty(mod.modResults, 'org.gradle.internal.http.connectionTimeout', '180000');
    upsertGradleProperty(mod.modResults, 'org.gradle.internal.http.socketTimeout', '180000');
    upsertGradleProperty(
      mod.modResults,
      'systemProp.org.gradle.internal.http.connectionTimeout',
      '180000',
    );
    upsertGradleProperty(
      mod.modResults,
      'systemProp.org.gradle.internal.http.socketTimeout',
      '180000',
    );
    return mod;
  });

  config = withDangerousMod(config, [
    'android',
    async (mod) => {
      const initDir = path.join(os.homedir(), '.gradle', 'init.d');
      await fs.promises.mkdir(initDir, { recursive: true });
      await fs.promises.writeFile(
        path.join(initDir, '00-bear-cash-maven-central-workaround.gradle'),
        INIT_SCRIPT,
        'utf8',
      );
      return mod;
    },
  ]);

  return config;
}

module.exports = withMavenCentralWorkaround;
