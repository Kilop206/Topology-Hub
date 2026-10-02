package com.userex.hub;

import io.quarkus.elytron.security.common.BcryptUtil;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.transaction.Transactional;
import java.util.Optional;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@ApplicationScoped
public class Bootstrap {

  @ConfigProperty(name = "hub.admin-email")
  Optional<String> email;

  @ConfigProperty(name = "hub.admin-password")
  Optional<String> password;

  @Transactional
  void start(@Observes StartupEvent event) {
    var configuredEmail = email.map(String::trim).filter(value -> !value.isEmpty());
    var configuredPassword = password.filter(value -> !value.isBlank());

    if (configuredEmail.isEmpty() && configuredPassword.isEmpty()) return;
    if (
      configuredEmail.isEmpty() ||
      configuredPassword.isEmpty() ||
      !configuredEmail.get().contains("@") ||
      configuredPassword.get().length() < 12
    ) throw new IllegalStateException(
      "Configure HUB_ADMIN_EMAIL e HUB_ADMIN_PASSWORD (12 caracteres ou mais)."
    );

    AuthResource.password(configuredPassword.get());
    if (User.byEmail(AuthResource.normalize(configuredEmail.get())) != null) return;

    var admin = new User();
    admin.email = AuthResource.normalize(configuredEmail.get());
    admin.displayName = "Administrador";
    admin.passwordHash = BcryptUtil.bcryptHash(configuredPassword.get());
    admin.role = "ADMIN";
    admin.persist();
  }
}
